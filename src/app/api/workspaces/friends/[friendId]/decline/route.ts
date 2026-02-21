import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Friend from '@/models/Friend'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, notFound, badRequest } from '@/lib/api-helpers'

/**
 * POST /api/workspaces/friends/[friendId]/decline
 * Decline a friend request. The authenticated user must be the friendUserId
 * (the person who was invited). Deletes the Friend record entirely.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { friendId } = await params
  await connectDB()

  // Find the pending friend record
  const friendRecord = await Friend.findById(friendId)
  if (!friendRecord) return notFound('Friend request')

  // Only the invited user can decline
  if (friendRecord.friendUserId.toString() !== user.id) {
    return badRequest('You cannot decline this request')
  }

  if (friendRecord.status === 'accepted') {
    return badRequest('Already accepted — use remove instead')
  }

  // Delete the pending record
  await Friend.deleteOne({ _id: friendId })

  // Also mark any related friend_request notifications as read
  await Notification.updateMany(
    { userId: user.id, type: 'friend_request', 'metadata.friendId': friendId, isRead: false },
    { isRead: true }
  )

  return NextResponse.json({ success: true, message: 'Friend request declined' })
}
