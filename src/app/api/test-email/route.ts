import { NextResponse } from 'next/server'
import { sendEmail, verifyEmailConfig } from '@/lib/email'
import {
  getWelcomeEmail,
  getVerificationEmail,
  getPasswordResetEmail,
  getEmailVerifiedEmail,
  getPasswordResetSuccessEmail,
} from '@/lib/email-templates'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    // Verify email configuration
    const isConfigured = await verifyEmailConfig()

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email server configuration is invalid. Please check your .env.local file.',
          configured: false,
        },
        { status: 500 }
      )
    }

    // Test sending a welcome email
    const testEmail = process.env.EMAIL_SERVER_USER || 'test@example.com'
    
    await sendEmail({
      to: testEmail,
      subject: 'Test Email - Boards Email System',
      html: getWelcomeEmail({
        name: 'Test User',
        email: testEmail,
      }),
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully! Check your inbox.',
      configured: true,
      testEmail,
      templates: [
        'Welcome Email',
        'Email Verification',
        'Password Reset',
        'Email Verified',
        'Password Reset Success',
      ],
    })
  } catch (error) {
    console.error('Email test failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
