import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Subscription from '@/models/Subscription'
import SubscriptionHistory from '@/models/SubscriptionHistory'
import { verifyPayment } from '@/lib/paystack'
import { sendEmail } from '@/lib/email'
import { getPaymentSuccessEmail } from '@/lib/email-templates'
import { z } from 'zod'

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
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
    const validation = verifyPaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { reference } = validation.data

    // Find the payment record
    const payment = await Payment.findOne({ paystackReference: reference })
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (payment.status === 'success') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        data: {
          status: 'success',
          amount: payment.amount,
          currency: payment.currency,
        },
      })
    }

    // Verify payment with Paystack
    const paystackResponse = await verifyPayment(reference)

    if (!paystackResponse.status) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const { data } = paystackResponse

    // Update payment status
    payment.status = data.status === 'success' ? 'success' : 'failed'
    payment.paidAt = data.status === 'success' ? new Date(data.paid_at) : undefined
    payment.metadata = {
      ...payment.metadata,
      paystackData: {
        gatewayResponse: data.gateway_response,
        channel: data.channel,
        fees: data.fees,
        customerCode: data.customer.customer_code,
      },
    }
    await payment.save()

    if (data.status === 'success') {
      // Get plan details
      const plan = await payment.populate('planId')
      const planData = (payment as any).planId

      // Calculate subscription end date
      const startDate = new Date()
      const endDate = new Date(startDate)
      if (planData.interval === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (planData.interval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      // Create or update subscription
      const subscription = await Subscription.create({
        userId: payment.userId,
        planId: payment.planId,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        paystackCustomerCode: data.customer.customer_code,
      })

      // Update payment with subscription ID
      payment.subscriptionId = subscription._id
      await payment.save()

      // Create subscription history
      await SubscriptionHistory.create({
        userId: payment.userId,
        subscriptionId: subscription._id,
        action: 'created',
        toPlanId: payment.planId,
        metadata: {
          paymentReference: reference,
          amount: payment.amount,
          currency: payment.currency,
        },
      })

      // Send payment success email
      try {
        const user = session.user as any
        const emailHtml = getPaymentSuccessEmail({
          name: user.name || user.email,
          planName: planData.name,
          amount: payment.amount,
          currency: payment.currency,
          startDate: startDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
        })

        await sendEmail({
          to: session.user.email,
          subject: `Payment Successful - Welcome to ${planData.name}`,
          html: emailHtml,
        })
      } catch (emailError) {
        console.error('Failed to send payment success email:', emailError)
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          status: 'success',
          amount: payment.amount,
          currency: payment.currency,
          subscription: {
            id: subscription._id,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: subscription.status,
          },
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment was not successful',
        data: {
          status: data.status,
          gatewayResponse: data.gateway_response,
        },
      })
    }
  } catch (error: any) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
