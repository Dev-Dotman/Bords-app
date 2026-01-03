import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import PasswordResetToken from '@/models/PasswordResetToken'
import { hashPassword, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getPasswordResetSuccessEmail } from '@/lib/email-templates'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const { token, password } = resetPasswordSchema.parse(body)
    
    await connectDB()

    // Hash the token to match stored hash
    const tokenHash = hashToken(token)

    // Find the reset token
    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null, // Token must not be used
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id })
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await User.findById(resetToken.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user's password and reset login attempts
    user.passwordHash = passwordHash
    user.loginAttempts = 0
    user.lockUntil = null
    await user.save()

    // Mark token as used
    resetToken.usedAt = new Date()
    await resetToken.save()

    // Delete all other reset tokens for this user
    await PasswordResetToken.deleteMany({
      userId: user._id,
      _id: { $ne: resetToken._id },
    })

    // Send password reset success email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Successfully Changed - Boards',
        html: getPasswordResetSuccessEmail({
          name: `${user.firstName} ${user.lastName}`.trim(),
        }),
      })
    } catch (emailError) {
      console.error('Failed to send password reset success email:', emailError)
      // Don't fail the reset if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
}
