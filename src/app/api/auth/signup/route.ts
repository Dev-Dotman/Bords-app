import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import EmailVerificationToken from '@/models/EmailVerificationToken'
import { hashPassword, generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getVerificationEmail, getWelcomeEmail } from '@/lib/email-templates'

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = signupSchema.parse(body)
    
    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: validatedData.email.toLowerCase() 
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await User.create({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email.toLowerCase(),
      passwordHash,
      emailVerifiedAt: null,
    })

    // Generate email verification token
    const token = generateToken(32)
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await EmailVerificationToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email Address - Boards',
        html: getVerificationEmail({
          name: `${user.firstName} ${user.lastName}`.trim(),
          verificationUrl,
        }),
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        userId: user._id.toString(),
        // REMOVE THIS IN PRODUCTION - Only for development testing
        verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
