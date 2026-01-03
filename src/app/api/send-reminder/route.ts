import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import ChecklistReminderEmail from '@/emails/ChecklistReminder'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      checklistTitle,
      taskText,
      timeRemaining,
      deadline,
      boardUrl,
    } = body

    // Validate required fields
    if (!checklistTitle || !taskText || !timeRemaining || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const userName = session.user.name || 'User'
    const userEmail = session.user.email

    // Render the email HTML
    const emailHtml = await render(
      ChecklistReminderEmail({
        userName,
        checklistTitle,
        taskText,
        timeRemaining,
        deadline,
        boardUrl,
      })
    )

    // Send email using nodemailer
    const result = await sendEmail({
      to: userEmail,
      subject:
        timeRemaining === 'overdue'
          ? `⚠️ Deadline Reached: ${taskText}`
          : `⏰ Reminder: ${taskText} due in ${timeRemaining}`,
      html: emailHtml,
    })

    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in send-reminder API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
