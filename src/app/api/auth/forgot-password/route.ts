import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import PasswordResetToken from '@/models/PasswordResetToken'
import { generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getPasswordResetEmail } from '@/lib/email-templates'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const { email } = forgotPasswordSchema.parse(body)
    
    await connectDB()

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
    }

    if (!user) {
      return NextResponse.json(successResponse, { status: 200 })
    }

    // Delete any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id })

    // Generate password reset token
    const token = generateToken(32)
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      usedAt: null,
    })

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - Boards',
        html: getPasswordResetEmail({
          name: `${user.firstName} ${user.lastName}`.trim(),
          resetUrl,
        }),
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success to prevent email enumeration
    }

    return NextResponse.json(
      {
        ...successResponse,
        // REMOVE THIS IN PRODUCTION - Only for development testing
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
