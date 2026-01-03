import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Subscription from '@/models/Subscription'
import SubscriptionHistory from '@/models/SubscriptionHistory'
import { verifyWebhookSignature } from '@/lib/paystack'
import { sendEmail } from '@/lib/email'
import { getPaymentSuccessEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    await connectDB()

    // Parse the event
    const event = JSON.parse(body)
    const { event: eventType, data } = event

    console.log('Paystack webhook event:', eventType)

    switch (eventType) {
      case 'charge.success': {
        // Find the payment record
        const payment = await Payment.findOne({ 
          paystackReference: data.reference 
        }).populate('planId userId')

        if (!payment) {
          console.error('Payment not found for reference:', data.reference)
          return NextResponse.json({ success: true }) // Return 200 to acknowledge
        }

        // Skip if already processed
        if (payment.status === 'success') {
          return NextResponse.json({ success: true })
        }

        // Update payment
        payment.status = 'success'
        payment.paidAt = new Date(data.paid_at)
        payment.metadata = {
          ...payment.metadata,
          webhookData: data,
        }
        await payment.save()

        const planData = (payment as any).planId
        const userData = (payment as any).userId

        // Calculate subscription dates
        const startDate = new Date()
        const endDate = new Date(startDate)
        if (planData.interval === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (planData.interval === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        // Create subscription
        const subscription = await Subscription.create({
          userId: payment.userId,
          planId: payment.planId,
          status: 'active',
          startDate,
          endDate,
          autoRenew: true,
          paystackCustomerCode: data.customer.customer_code,
        })

        payment.subscriptionId = subscription._id
        await payment.save()

        // Create history
        await SubscriptionHistory.create({
          userId: payment.userId,
          subscriptionId: subscription._id,
          action: 'created',
          toPlanId: payment.planId,
          metadata: {
            paymentReference: data.reference,
            amount: payment.amount,
            webhookEvent: eventType,
          },
        })

        // Send email
        try {
          const emailHtml = getPaymentSuccessEmail({
            name: userData.name || userData.email,
            planName: planData.name,
            amount: payment.amount,
            currency: payment.currency,
            startDate: startDate.toLocaleDateString(),
            endDate: endDate.toLocaleDateString(),
          })

          await sendEmail({
            to: userData.email,
            subject: `Payment Successful - Welcome to ${planData.name}`,
            html: emailHtml,
          })
        } catch (emailError) {
          console.error('Failed to send webhook payment email:', emailError)
        }

        break
      }

      case 'subscription.disable':
      case 'subscription.not_renew': {
        // Handle subscription cancellation
        const subscription = await Subscription.findOne({
          paystackSubscriptionCode: data.subscription_code,
        })

        if (subscription) {
          subscription.status = 'canceled'
          subscription.canceledAt = new Date()
          subscription.autoRenew = false
          await subscription.save()

          await SubscriptionHistory.create({
            userId: subscription.userId,
            subscriptionId: subscription._id,
            action: 'canceled',
            metadata: {
              webhookEvent: eventType,
              reason: 'User canceled subscription',
            },
          })
        }

        break
      }

      default:
        console.log('Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
