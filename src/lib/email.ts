import nodemailer from 'nodemailer'

// Create reusable transporter using ZeptoMail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.zeptomail.com',
    port: 587,
    secure: false, // use STARTTLS
    requireTLS: true, // force TLS
    auth: {
      user: process.env.ZEPTOMAIL_SMTP_USER,
      pass: process.env.ZEPTOMAIL_SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false, // accept self-signed certificates
    },
  });

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
      from: process.env.ZEPTOMAIL_FROM_EMAIL || 'Bords <noreply@bords.app>',
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
