import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Boards <noreply@boards.app>',
      to,
      subject,
      html,
      text: text || stripHtml(html),
    })

    console.log('✅ Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    throw error
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    await transporter.verify()
    console.log('✅ Email server is ready')
    return true
  } catch (error) {
    console.error('❌ Email server verification failed:', error)
    return false
  }
}
