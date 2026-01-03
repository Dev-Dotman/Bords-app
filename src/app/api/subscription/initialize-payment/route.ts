import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'
import Payment from '@/models/Payment'
import { initializePayment, generatePaymentReference } from '@/lib/paystack'
import { z } from 'zod'

const initializePaymentSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Parse and validate request body
    const body = await request.json()
    const validation = initializePaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { planId } = validation.data

    // Get the plan
    const plan = await Plan.findById(planId)
    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive plan' },
        { status: 404 }
      )
    }

    // Get user from session (you'll need to add user ID to session)
    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      )
    }

    // Generate payment reference
    const reference = generatePaymentReference(userId)

    // Convert amount to kobo (Paystack uses kobo for NGN)
    const amountInKobo = plan.price * 100

    // Create payment record
    const payment = await Payment.create({
      userId,
      planId: plan._id,
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      paymentMethod: 'paystack',
      paystackReference: reference,
      metadata: {
        planName: plan.name,
        interval: plan.interval,
      },
    })

    // Initialize Paystack payment
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscription/verify?reference=${reference}`
    
    const paystackResponse = await initializePayment({
      email: session.user.email,
      amount: amountInKobo,
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId,
        planId: plan._id.toString(),
        planName: plan.name,
        paymentId: payment._id.toString(),
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    })

    // Update payment with access code
    payment.paystackAccessCode = paystackResponse.data.access_code
    await payment.save()

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference,
        amount: plan.price,
        currency: plan.currency,
      },
    })
  } catch (error: any) {
    console.error('Initialize payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
