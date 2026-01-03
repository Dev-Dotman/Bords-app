import Plan from '@/models/Plan'
import Subscription from '@/models/Subscription'
import { Types } from 'mongoose'

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(userId: string | Types.ObjectId) {
  const subscription = await Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: new Date() },
  }).populate('planId')
  
  return subscription
}

/**
 * Get user's current plan (or default free plan)
 */
export async function getUserPlan(userId: string | Types.ObjectId) {
  const subscription = await getActiveSubscription(userId)
  
  if (subscription && subscription.planId) {
    return subscription.planId
  }
  
  // Return free plan if no active subscription
  const freePlan = await Plan.findOne({ slug: 'free' })
  return freePlan
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string | Types.ObjectId,
  feature: string
): Promise<boolean> {
  const plan = await getUserPlan(userId)
  
  if (!plan) return false
  
  return plan.features.includes(feature)
}

/**
 * Check if user can create more boards
 */
export async function canCreateBoard(
  userId: string | Types.ObjectId,
  currentBoardCount: number
): Promise<boolean> {
  const plan = await getUserPlan(userId)
  
  if (!plan) return false
  
  // -1 means unlimited
  if (plan.maxBoards === -1) return true
  
  return currentBoardCount < plan.maxBoards
}

/**
 * Check if user can add more tasks to a board
 */
export async function canAddTask(
  userId: string | Types.ObjectId,
  currentTaskCount: number
): Promise<boolean> {
  const plan = await getUserPlan(userId)
  
  if (!plan) return false
  
  // -1 means unlimited
  if (plan.maxTasksPerBoard === -1) return true
  
  return currentTaskCount < plan.maxTasksPerBoard
}

/**
 * Get subscription status and days remaining
 */
export async function getSubscriptionStatus(userId: string | Types.ObjectId) {
  const subscription = await getActiveSubscription(userId)
  
  if (!subscription) {
    return {
      hasSubscription: false,
      status: null,
      daysRemaining: 0,
      isExpiringSoon: false,
    }
  }
  
  const now = new Date()
  const endDate = new Date(subscription.endDate)
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    hasSubscription: true,
    status: subscription.status,
    daysRemaining,
    isExpiringSoon: daysRemaining <= 3 && daysRemaining > 0,
    endDate: subscription.endDate,
  }
}
