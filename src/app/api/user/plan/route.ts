import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Subscription from '@/models/Subscription'
import Plan from '@/models/Plan'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).populate('planId')

    // If user has an active subscription, return the plan details
    if (subscription && subscription.planId) {
      const plan = subscription.planId as any
      return NextResponse.json({
        name: plan.name,
        slug: plan.slug,
        maxBoards: plan.maxBoards,
        maxTasksPerBoard: plan.maxTasksPerBoard,
        maxCollaborators: plan.maxCollaborators,
        hasAdvancedFeatures: plan.hasAdvancedFeatures,
        subscriptionStatus: subscription.status,
        endDate: subscription.endDate
      })
    }

    // Default to free plan
    return NextResponse.json({
      name: 'Free',
      slug: 'free',
      maxBoards: 3,
      maxTasksPerBoard: 50,
      maxCollaborators: 0,
      hasAdvancedFeatures: false,
      subscriptionStatus: 'none'
    })
  } catch (error) {
    console.error('Error fetching user plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user plan' },
      { status: 500 }
    )
  }
}
