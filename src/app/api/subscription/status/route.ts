import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import { getActiveSubscription, getUserPlan, getSubscriptionStatus } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      )
    }

    // Get subscription status
    const status = await getSubscriptionStatus(userId)
    
    // Get current plan
    const plan = await getUserPlan(userId)
    
    // Get active subscription details
    const subscription = await getActiveSubscription(userId)

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription ? {
          id: subscription._id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          autoRenew: subscription.autoRenew,
        } : null,
        plan: plan ? {
          id: plan._id,
          name: plan.name,
          slug: plan.slug,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
          maxBoards: plan.maxBoards,
          maxTasksPerBoard: plan.maxTasksPerBoard,
          maxCollaborators: plan.maxCollaborators,
          hasAdvancedFeatures: plan.hasAdvancedFeatures,
        } : null,
        status: {
          hasSubscription: status.hasSubscription,
          daysRemaining: status.daysRemaining,
          isExpiringSoon: status.isExpiringSoon,
        },
      },
    })
  } catch (error: any) {
    console.error('Get subscription status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}
