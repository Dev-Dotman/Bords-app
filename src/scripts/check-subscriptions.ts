import connectDB from '@/lib/mongodb'
import Subscription from '@/models/Subscription'
import SubscriptionHistory from '@/models/SubscriptionHistory'
import User from '@/models/User'
import { sendEmail } from '@/lib/email'
import { 
  getSubscriptionExpiryReminderEmail, 
  getSubscriptionExpiredEmail 
} from '@/lib/email-templates'

/**
 * Cron job to check for expiring and expired subscriptions
 * Should be run daily
 */
export async function checkSubscriptions() {
  try {
    await connectDB()

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find subscriptions expiring in 3 days
    const expiringSoon = await Subscription.find({
      status: 'active',
      endDate: {
        $gte: now,
        $lte: threeDaysFromNow,
      },
    }).populate('userId planId')

    console.log(`Found ${expiringSoon.length} subscriptions expiring soon`)

    // Send reminder emails
    for (const subscription of expiringSoon) {
      try {
        const userData = (subscription as any).userId
        const planData = (subscription as any).planId
        
        const daysRemaining = Math.ceil(
          (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        const emailHtml = getSubscriptionExpiryReminderEmail({
          name: userData.name || userData.email,
          planName: planData.name,
          daysRemaining,
          endDate: subscription.endDate.toLocaleDateString(),
        })

        await sendEmail({
          to: userData.email,
          subject: `Your ${planData.name} subscription expires in ${daysRemaining} days`,
          html: emailHtml,
        })

        console.log(`Sent expiry reminder to ${userData.email}`)
      } catch (error) {
        console.error('Failed to send expiry reminder:', error)
      }
    }

    // Find expired subscriptions
    const expired = await Subscription.find({
      status: 'active',
      endDate: { $lt: now },
    }).populate('userId planId')

    console.log(`Found ${expired.length} expired subscriptions`)

    // Update expired subscriptions
    for (const subscription of expired) {
      try {
        const userData = (subscription as any).userId
        const planData = (subscription as any).planId

        // Update subscription status
        subscription.status = 'expired'
        await subscription.save()

        // Create history record
        await SubscriptionHistory.create({
          userId: subscription.userId,
          subscriptionId: subscription._id,
          action: 'expired',
          fromPlanId: subscription.planId,
          metadata: {
            expiredAt: now.toISOString(),
            autoExpired: true,
          },
        })

        // Send expiration email
        const emailHtml = getSubscriptionExpiredEmail({
          name: userData.name || userData.email,
          planName: planData.name,
          expiredDate: subscription.endDate.toLocaleDateString(),
        })

        await sendEmail({
          to: userData.email,
          subject: `Your ${planData.name} subscription has expired`,
          html: emailHtml,
        })

        console.log(`Expired subscription for ${userData.email}`)
      } catch (error) {
        console.error('Failed to process expired subscription:', error)
      }
    }

    return {
      success: true,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
    }
  } catch (error) {
    console.error('Subscription check error:', error)
    throw error
  }
}

// CLI execution
if (require.main === module) {
  checkSubscriptions()
    .then((result) => {
      console.log('✅ Subscription check completed:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Subscription check failed:', error)
      process.exit(1)
    })
}
