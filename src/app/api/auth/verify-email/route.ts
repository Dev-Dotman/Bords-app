import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import EmailVerificationToken from '@/models/EmailVerificationToken'
import { hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getEmailVerifiedEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Hash the token to match stored hash
    const tokenHash = hashToken(token)

    // Find the verification token
    const verificationToken = await EmailVerificationToken.findOne({
      tokenHash,
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      await EmailVerificationToken.deleteOne({ _id: verificationToken._id })
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Find and update the user
    const user = await User.findById(verificationToken.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerifiedAt) {
      await EmailVerificationToken.deleteOne({ _id: verificationToken._id })
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Update user's emailVerifiedAt
    user.emailVerifiedAt = new Date()
    await user.save()

    // Delete the used token
    await EmailVerificationToken.deleteOne({ _id: verificationToken._id })

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Email Verified Successfully! - Boards',
        html: getEmailVerifiedEmail({
          name: `${user.firstName} ${user.lastName}`.trim(),
        }),
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the verification if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! You can now log in.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    )
  }
}
