import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import { getUserPlan, hasFeatureAccess } from '@/lib/subscription'

export interface SubscriptionMiddlewareConfig {
  requiredPlan?: string
  requiredFeature?: string
  minBoards?: number
  minTasks?: number
}

/**
 * Middleware to check subscription and feature access
 * Use this in API routes that require subscription
 */
export async function withSubscription(
  request: NextRequest,
  config: SubscriptionMiddlewareConfig = {}
) {
  try {
    // Get session token
    const token = await getToken({ req: request })
    
    if (!token || !token.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const userId = token.sub

    // Get user's current plan
    const plan = await getUserPlan(userId)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'No active plan found' },
        { status: 403 }
      )
    }

    // Check required plan
    if (config.requiredPlan && plan.slug !== config.requiredPlan) {
      return NextResponse.json(
        { 
          error: 'Upgrade required',
          message: `This feature requires the ${config.requiredPlan} plan`,
          currentPlan: plan.slug,
          requiredPlan: config.requiredPlan,
        },
        { status: 403 }
      )
    }

    // Check required feature
    if (config.requiredFeature) {
      const hasAccess = await hasFeatureAccess(userId, config.requiredFeature)
      
      if (!hasAccess) {
        return NextResponse.json(
          { 
            error: 'Feature not available',
            message: `This feature is not included in your ${plan.name} plan`,
            feature: config.requiredFeature,
          },
          { status: 403 }
        )
      }
    }

    // Return user info and plan for use in the route
    return {
      userId,
      plan,
      hasAccess: true,
    }
  } catch (error: any) {
    console.error('Subscription middleware error:', error)
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    )
  }
}

/**
 * Helper to check board limits
 */
export async function checkBoardLimit(userId: string, currentCount: number) {
  const plan = await getUserPlan(userId)
  
  if (!plan) {
    return {
      allowed: false,
      message: 'No active plan found',
    }
  }

  // -1 means unlimited
  if (plan.maxBoards === -1) {
    return {
      allowed: true,
      limit: -1,
      current: currentCount,
    }
  }

  if (currentCount >= plan.maxBoards) {
    return {
      allowed: false,
      limit: plan.maxBoards,
      current: currentCount,
      message: `You've reached the maximum of ${plan.maxBoards} boards for your ${plan.name} plan`,
      upgradeRequired: true,
    }
  }

  return {
    allowed: true,
    limit: plan.maxBoards,
    current: currentCount,
    remaining: plan.maxBoards - currentCount,
  }
}

/**
 * Helper to check task limits
 */
export async function checkTaskLimit(userId: string, currentCount: number) {
  const plan = await getUserPlan(userId)
  
  if (!plan) {
    return {
      allowed: false,
      message: 'No active plan found',
    }
  }

  // -1 means unlimited
  if (plan.maxTasksPerBoard === -1) {
    return {
      allowed: true,
      limit: -1,
      current: currentCount,
    }
  }

  if (currentCount >= plan.maxTasksPerBoard) {
    return {
      allowed: false,
      limit: plan.maxTasksPerBoard,
      current: currentCount,
      message: `You've reached the maximum of ${plan.maxTasksPerBoard} tasks per board for your ${plan.name} plan`,
      upgradeRequired: true,
    }
  }

  return {
    allowed: true,
    limit: plan.maxTasksPerBoard,
    current: currentCount,
    remaining: plan.maxTasksPerBoard - currentCount,
  }
}

/**
 * Helper to check collaborator limits
 */
export async function checkCollaboratorLimit(userId: string, currentCount: number) {
  const plan = await getUserPlan(userId)
  
  if (!plan) {
    return {
      allowed: false,
      message: 'No active plan found',
    }
  }

  // -1 means unlimited
  if (plan.maxCollaborators === -1) {
    return {
      allowed: true,
      limit: -1,
      current: currentCount,
    }
  }

  if (currentCount >= plan.maxCollaborators) {
    return {
      allowed: false,
      limit: plan.maxCollaborators,
      current: currentCount,
      message: `You've reached the maximum of ${plan.maxCollaborators} collaborators for your ${plan.name} plan`,
      upgradeRequired: true,
    }
  }

  return {
    allowed: true,
    limit: plan.maxCollaborators,
    current: currentCount,
    remaining: plan.maxCollaborators - currentCount,
  }
}
