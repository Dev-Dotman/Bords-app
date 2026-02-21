import { NextResponse } from 'next/server'
import { render } from '@react-email/render'
import connectDB from '@/lib/mongodb'
import { sendEmail } from '@/lib/email'
import BoardDocument from '@/models/BoardDocument'
import User from '@/models/User'
import SentReminder from '@/models/SentReminder'
import ChecklistReminderEmail from '@/emails/ChecklistReminder'
import ReminderEmail from '@/emails/ReminderEmail'
import { format, isPast, differenceInMinutes } from 'date-fns'
import { createReminderInboxEntry } from '@/lib/reminder-inbox'

/**
 * Server-side cron: Scan all boards in MongoDB for upcoming deadlines and
 * send reminder emails **independently of the client**.
 *
 * This is the safety net for when the browser is closed.
 *
 * Auth: Bearer token matching CRON_SECRET env var.
 * Recommended schedule: every 5 minutes.
 *
 * Dedup: Checks the SentReminder collection before sending.  If the
 * client-side system already sent a reminder for the same item + interval,
 * this cron will skip it.
 */

// How far ahead to look for upcoming deadlines (minutes)
const LOOKAHEAD_MINUTES = 35
// Cooldown: don't re-send if the same key was sent within this window
const COOLDOWN_MS = 4 * 60 * 1000 // 4 minutes

// Standard intervals (same as the client-side system)
const DEADLINE_INTERVALS = [
  { offsetMs: 30 * 60 * 1000, label: '30 minutes', urgent: false },
  { offsetMs: 10 * 60 * 1000, label: '10 minutes', urgent: true },
  { offsetMs: 5 * 60 * 1000,  label: '5 minutes',  urgent: true },
  { offsetMs: 0,               label: 'overdue',    urgent: true },
] as const

export async function GET(request: Request) {
  // ── TEMPORARILY DISABLED ──
  // Reminder cron is disabled while debugging performance issues.
  // Remove this block to re-enable.
  // return NextResponse.json({ message: 'Reminder cron temporarily disabled', sent: 0 })

  // ── Auth ──
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()

    const now = new Date()
    const windowEnd = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60 * 1000)
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000) // include overdue up to 1 hour ago

    // ── Find boards that have items with deadlines in our window ──
    // We fetch all boards and filter in-memory because deadline data is nested
    // inside sub-documents (checklist items, kanban columns/tasks, reminder items).
    // For large-scale, we'd add indexed date fields – fine for current scale.
    const boards = await BoardDocument.find({}).lean()

    let sent = 0
    let skipped = 0
    let errors = 0

    for (const board of boards) {
      // Look up board owner's email
      const owner = await User.findById(board.owner).lean() as any
      if (!owner?.email) continue

      const ownerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'User'
      const ownerEmail = owner.email
      const ownerId = owner._id.toString()
      const boardDocId = board._id.toString()

      // ─── 1. Scan checklist items ───
      for (const checklist of (board.checklists || [])) {
        for (const item of (checklist.items || [])) {
          if (item.completed) continue
          const deadline = parseDeadline(item.dueDate, item.dueTime || item.deadline)
          if (!deadline) continue

          const result = await processDeadlineItem({
            boardDocId,
            source: 'checklist',
            parentTitle: checklist.title || 'Checklist',
            itemId: item.id,
            itemText: item.text,
            deadline: deadline || new Date(0), // fallback to epoch if parsing fails, but ideally should be filtered out by parseDeadline
            now,
            windowStart,
            windowEnd,
            recipientEmail: ownerEmail,
            recipientName: ownerName,
            senderId: ownerId,
            recipientId: ownerId,
          })
          sent += result.sent
          skipped += result.skipped
          errors += result.errors
        }
      }

      // ─── 2. Scan kanban board tasks ───
      for (const kanban of (board.kanbanBoards || [])) {
        for (const column of (kanban.columns || [])) {
          for (const task of (column.tasks || [])) {
            if (task.completed) continue
            const deadline = parseDeadline(task.dueDate)
            if (!deadline) continue

            const result = await processDeadlineItem({
              boardDocId,
              source: 'kanban',
              parentTitle: kanban.title || 'Kanban Board',
              itemId: task.id,
              itemText: task.title || task.text || 'Task',
              deadline: deadline || new Date(0), // fallback to epoch if parsing fails, but ideally should be filtered out by parseDeadline
              now,
              windowStart,
              windowEnd,
              recipientEmail: ownerEmail,
              recipientName: ownerName,
              senderId: ownerId,
              recipientId: ownerId,
            })
            sent += result.sent
            skipped += result.skipped
            errors += result.errors
          }
        }
      }

      // ─── 3. Scan reminder widget items ───
      for (const reminder of (board.reminders || [])) {
        // Determine recipient — could be assigned to someone else
        let recipientEmail = ownerEmail
        let recipientName = ownerName
        let recipientId = ownerId
        if (reminder.assignedTo?.email) {
          recipientEmail = reminder.assignedTo.email
          recipientName = `${reminder.assignedTo.firstName || ''} ${reminder.assignedTo.lastName || ''}`.trim() || 'User'
          if (reminder.assignedTo.userId) recipientId = reminder.assignedTo.userId
        }

        for (const item of (reminder.items || [])) {
          if (item.completed) continue
          const deadline = parseDeadline(item.dueDate, item.dueTime)
          if (!deadline) continue

          const result = await processDeadlineItem({
            boardDocId,
            source: 'reminder',
            parentTitle: reminder.title || 'Reminder',
            itemId: item.id,
            itemText: item.text,
            deadline: deadline || new Date(0), // fallback to epoch if parsing fails, but ideally should be filtered out by parseDeadline
            now,
            windowStart,
            windowEnd,
            recipientEmail,
            recipientName,
            senderName: ownerName,
            senderId: ownerId,
            recipientId,
          })
          sent += result.sent
          skipped += result.skipped
          errors += result.errors
        }
      }
    }

    return NextResponse.json({
      message: 'Reminder cron completed',
      sent,
      skipped,
      errors,
      checkedBoards: boards.length,
      durationMs: Date.now() - now.getTime(),
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Reminder cron error:', error)
    return NextResponse.json({ error: error.message || 'Cron failed' }, { status: 500 })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ProcessItemArgs {
  boardDocId: string
  source: 'checklist' | 'kanban' | 'reminder'
  parentTitle: string
  itemId: string
  itemText: string
  deadline: Date
  now: Date
  windowStart: Date
  windowEnd: Date
  recipientEmail: string
  recipientName: string
  senderName?: string
  senderId: string
  recipientId: string
}

async function processDeadlineItem(args: ProcessItemArgs) {
  const {
    boardDocId, source, parentTitle, itemId, itemText, deadline,
    now, windowStart, windowEnd, recipientEmail, recipientName, senderName,
    senderId, recipientId,
  } = args

  let sent = 0
  let skipped = 0
  let errors = 0

  // Only process deadlines within our scan window
  if (deadline < windowStart || deadline > windowEnd) {
    // Exception: still process overdue items up to windowStart
    // (windowStart is already set to 1 hour ago)
    if (deadline >= windowStart) return { sent, skipped, errors }
    // Skip items older than windowStart
    return { sent, skipped, errors }
  }

  const timeUntilMs = deadline.getTime() - now.getTime()

  for (const { offsetMs, label } of DEADLINE_INTERVALS) {
    const fireAtMs = deadline.getTime() - offsetMs
    const diffFromNow = fireAtMs - now.getTime()

    // Should this interval fire right now? (within ±5 minutes of the fire time)
    const shouldFire = Math.abs(diffFromNow) <= 5 * 60 * 1000

    // For overdue: fire if the deadline is in the past and within the window
    const isOverdue = label === 'overdue' && timeUntilMs <= 0 && timeUntilMs > -60 * 60 * 1000

    if (!shouldFire && !isOverdue) continue

    // ── Dedup check ──
    const dedupKey = `${boardDocId}::${source}::${itemId}::${label}::${recipientEmail}`
    const recent = await SentReminder.findOne({
      key: dedupKey,
      sentAt: { $gte: new Date(now.getTime() - COOLDOWN_MS) },
    })
    if (recent) {
      skipped++
      continue
    }

    // ── Render & send ──
    try {
      const timeRemaining = label
      let emailHtml: string
      let subject: string

      if (source === 'checklist' || source === 'kanban') {
        const sourceLabel = source === 'checklist' ? 'Checklist' : 'Kanban Board'
        const isOver = label === 'overdue'

        emailHtml = await render(
          ChecklistReminderEmail({
            userName: recipientName,
            checklistTitle: `${sourceLabel}: ${parentTitle}`,
            taskText: itemText,
            timeRemaining: timeRemaining,
            deadline: format(deadline, 'MMM d, yyyy @ h:mm a'),
            boardUrl: 'https://bords.app',
          })
        )

        subject = isOver
          ? `⚠️ Deadline Reached: ${itemText}`
          : `⏰ Reminder: ${itemText} due in ${timeRemaining}`
      } else {
        // Reminder widget
        const isOver = label === 'overdue'
        emailHtml = await render(
          ReminderEmail({
            recipientName,
            senderName: senderName || 'Bords',
            reminderTitle: parentTitle,
            items: [{
              text: itemText,
              dueDate: format(deadline, 'MMM d, h:mm a'),
              overdue: isOver,
              completed: false,
            }],
            boardUrl: 'https://bords.app',
          })
        )

        subject = isOver
          ? `⚠️ Overdue reminder: ${parentTitle}`
          : `🔔 Reminder: ${itemText} due in ${timeRemaining}`
      }

      await sendEmail({
        to: recipientEmail,
        subject,
        html: emailHtml,
      })

      // Record in SentReminder so client-side won't re-send
      await SentReminder.create({
        key: dedupKey,
        boardDocId,
        source,
        itemId,
        intervalLabel: label,
        recipientEmail,
        sentAt: now,
        sentBy: 'cron',
      })

      // Create inbox entries for recipient
      try {
        await createReminderInboxEntry({
          source,
          parentTitle,
          itemText,
          itemId,
          timeRemaining: label,
          senderId,
          recipientId,
          recipientEmail,
          dueDate: deadline,
          boardDocId,
        })
      } catch (inboxErr: any) {
        console.warn(`Cron inbox entry failed [${source}/${itemId}/${label}]:`, inboxErr.message)
      }

      sent++
    } catch (err: any) {
      console.error(`Cron reminder send failed [${source}/${itemId}/${label}]:`, err.message)
      errors++
    }
  }

  return { sent, skipped, errors }
}

/**
 * Parse various deadline formats stored in board data.
 * Returns a Date or null.
 */
function parseDeadline(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!dateStr) return null

  try {
    // If dateStr already looks like a full ISO datetime
    if (dateStr.includes('T')) {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? null : d
    }

    // Date-only (e.g. '2026-03-01') + optional time (e.g. '14:30')
    if (timeStr) {
      const d = new Date(`${dateStr}T${timeStr}`)
      return isNaN(d.getTime()) ? null : d
    }

    // Date-only — default to end of day
    const d = new Date(`${dateStr}T23:59:59`)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}
