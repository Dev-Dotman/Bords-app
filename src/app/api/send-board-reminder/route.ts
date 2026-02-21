import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import ReminderEmail from '@/emails/ReminderEmail'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sendEmail } from '@/lib/email'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      reminderTitle,
      items,
      recipientEmail,
      recipientName,
      message,
    } = body

    // Validate required fields
    if (!reminderTitle || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: reminderTitle, items' },
        { status: 400 }
      )
    }

    const senderName = session.user.name || 'Someone'

    // If a specific recipient email is provided (sending to a friend),
    // send to that email. Otherwise send to the logged-in user (self-reminder).
    const toEmail = recipientEmail || session.user.email
    const toName = recipientName || session.user.name || 'User'

    // If sending to a friend, verify they exist
    if (recipientEmail && recipientEmail !== session.user.email) {
      await connectDB()
      const recipient = await User.findOne({ email: recipientEmail })
      if (!recipient) {
        return NextResponse.json(
          { error: 'Recipient not found' },
          { status: 404 }
        )
      }
    }

    // Render the email HTML
    const emailHtml = await render(
      ReminderEmail({
        recipientName: toName,
        senderName,
        reminderTitle,
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

    const hasOverdue = items.some((i: { overdue?: boolean; completed?: boolean }) => i.overdue && !i.completed)

    const subject = recipientEmail && recipientEmail !== session.user.email
      ? hasOverdue
        ? `⚠️ ${senderName} sent you an overdue reminder: ${reminderTitle}`
        : `🔔 ${senderName} sent you a reminder: ${reminderTitle}`
      : hasOverdue
        ? `⚠️ Overdue reminder: ${reminderTitle}`
        : `🔔 Reminder: ${reminderTitle}`

    const result = await sendEmail({
      to: toEmail,
      subject,
      html: emailHtml,
    })

    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in send-board-reminder API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
