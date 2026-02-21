import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import ChecklistReminderEmail from '@/emails/ChecklistReminder'
import ReminderEmail from '@/emails/ReminderEmail'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sendEmail } from '@/lib/email'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SentReminder from '@/models/SentReminder'
import { createReminderInboxEntry } from '@/lib/reminder-inbox'

/**
 * Unified reminder-sending endpoint.
 *
 * Accepts a common payload shape and picks the right email template based on
 * the `source` field: "checklist" | "kanban" | "reminder".
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      source,
      title,
      items,
      recipient,
      message,
      timeRemaining,
      boardDocId,   // optional: for dedup tracking with server-side cron
      itemId,       // optional: specific item id for dedup
    } = body

    // ── Validate ──
    if (!source || !title || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: source, title, items' },
        { status: 400 }
      )
    }

    const senderName = session.user.name || 'Someone'

    // Determine recipient
    const toEmail = recipient?.email || session.user.email
    const toName = recipient?.name || session.user.name || 'User'

    // If sending to someone else, verify they exist
    if (recipient?.email && recipient.email !== session.user.email) {
      await connectDB()
      const recipientUser = await User.findOne({ email: recipient.email })
      if (!recipientUser) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
      }
    } else {
      await connectDB()
    }

    // ── Dedup check: skip if already sent within the last 4 minutes ──
    if (boardDocId && itemId) {
      const dedupKey = `${boardDocId}::${source}::${itemId}::${timeRemaining || 'manual'}::${toEmail}`
      const COOLDOWN_MS = 4 * 60 * 1000
      const recent = await SentReminder.findOne({
        key: dedupKey,
        sentAt: { $gte: new Date(Date.now() - COOLDOWN_MS) },
      })
      if (recent) {
        return NextResponse.json(
          { success: true, deduplicated: true, messageId: null },
          { status: 200 }
        )
      }
    }

    // ── Render the correct template ──
    let emailHtml: string
    let subject: string

    if (source === 'checklist' || source === 'kanban') {
      // Single-item deadline reminder — use the ChecklistReminder template
      // (works for both checklists and kanban tasks)
      const item = items[0]
      const isOverdue = timeRemaining === 'overdue'
      const sourceLabel = source === 'checklist' ? 'Checklist' : 'Kanban Board'

      emailHtml = await render(
        ChecklistReminderEmail({
          userName: toName,
          checklistTitle: `${sourceLabel}: ${title}`,
          taskText: item.text,
          timeRemaining: timeRemaining || 'upcoming',
          deadline: item.dueDate || 'No deadline set',
          boardUrl: 'https://bords.app',
        })
      )

      if (recipient?.email && recipient.email !== session.user.email) {
        subject = isOverdue
          ? `⚠️ ${senderName} — Deadline reached: ${item.text}`
          : `⏰ ${senderName} — Reminder: ${item.text} due in ${timeRemaining}`
      } else {
        subject = isOverdue
          ? `⚠️ Deadline Reached: ${item.text}`
          : `⏰ Reminder: ${item.text} due in ${timeRemaining}`
      }
    } else {
      // Reminder widget — multi-item template
      const hasOverdue = items.some((i: { overdue?: boolean; completed?: boolean }) => i.overdue && !i.completed)

      emailHtml = await render(
        ReminderEmail({
          recipientName: toName,
          senderName,
          reminderTitle: title,
          items: items.map((item: { text: string; dueDate?: string; overdue?: boolean; completed?: boolean }) => ({
            text: item.text,
            dueDate: item.dueDate,
            overdue: item.overdue,
            completed: item.completed,
          })),
          message,
          boardUrl: 'https://bords.app',
        })
      )

      if (recipient?.email && recipient.email !== session.user.email) {
        subject = hasOverdue
          ? `⚠️ ${senderName} sent you an overdue reminder: ${title}`
          : `🔔 ${senderName} sent you a reminder: ${title}`
      } else {
        subject = hasOverdue
          ? `⚠️ Overdue reminder: ${title}`
          : `🔔 Reminder: ${title}`
      }
    }

    // ── Send ──
    const result = await sendEmail({
      to: toEmail,
      subject,
      html: emailHtml,
    })

    // ── Record in SentReminder for dedup ──
    if (boardDocId && itemId) {
      const dedupKey = `${boardDocId}::${source}::${itemId}::${timeRemaining || 'manual'}::${toEmail}`
      try {
        await SentReminder.create({
          key: dedupKey,
          boardDocId,
          source,
          itemId,
          intervalLabel: timeRemaining || 'manual',
          recipientEmail: toEmail,
          sentAt: new Date(),
          sentBy: 'client',
        })
      } catch (e) {
        // Non-critical — don't fail the response if dedup record insertion fails
        console.warn('Failed to record SentReminder:', e)
      }
    }

    // ── Create inbox entries for recipient ──
    try {
      // Resolve recipient user ID
      let recipientUserId = session.user.id
      if (recipient?.email && recipient.email !== session.user.email) {
        const recipientUser = await User.findOne({ email: recipient.email }).select('_id').lean() as any
        if (recipientUser) recipientUserId = recipientUser._id.toString()
      }

      await createReminderInboxEntry({
        source,
        parentTitle: title,
        itemText: items[0]?.text || title,
        itemId: itemId || `${source}-${Date.now()}`,
        timeRemaining: timeRemaining || 'manual',
        senderId: session.user.id,
        recipientId: recipientUserId,
        recipientEmail: toEmail,
        dueDate: items[0]?.dueDate ? new Date(items[0].dueDate) : null,
        boardDocId: boardDocId || undefined,
      })
    } catch (e) {
      // Non-critical — don't fail the response if inbox entry creation fails
      console.warn('Failed to create reminder inbox entry:', e)
    }

    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in unified reminders/send API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
