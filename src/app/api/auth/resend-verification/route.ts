import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { render } from '@react-email/components'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import EmailVerificationToken from '@/models/EmailVerificationToken'
import { generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import VerificationEmail from '@/emails/VerificationEmail'

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const { email } = resendSchema.parse(body)
    
    await connectDB()

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'Email is already verified. You can log in now.' },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this user
    await EmailVerificationToken.deleteMany({ userId: user._id })

    // Generate new verification token
    const token = generateToken(32)
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await EmailVerificationToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    })

    // Send verification email
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://app.bords.app'
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`
    
    try {
      const emailHtml = await render(
        VerificationEmail({
          name: `${user.firstName} ${user.lastName}`.trim(),
          verificationUrl,
        })
      )
      
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email Address - BORDS',
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend verification error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while resending verification email' },
      { status: 500 }
    )
  }
}
