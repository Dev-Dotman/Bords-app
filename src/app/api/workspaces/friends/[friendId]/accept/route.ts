import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Friend from '@/models/Friend'
import Workspace from '@/models/Workspace'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, notFound, badRequest } from '@/lib/api-helpers'

/**
 * POST /api/workspaces/friends/[friendId]/accept
 * Accept a friend request. The authenticated user must be the friendUserId
 * (i.e. the person who was invited). On acceptance:
 * 1. Set the Friend record status to 'accepted'
 * 2. Create a reciprocal Friend record (so both users see each other)
 * 3. Send a 'friend_accepted' notification to the requester
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

  // Only the invited user can accept
  if (friendRecord.friendUserId.toString() !== user.id) {
    return badRequest('You cannot accept this request')
  }

  if (friendRecord.status === 'accepted') {
    return badRequest('Already accepted')
  }

  // 1. Accept the friend record
  friendRecord.status = 'accepted'
  await friendRecord.save()

  // 2. Create a reciprocal Friend record (accepter → requester)
  const accepterWs = await Workspace.findOne({ ownerId: user.id, type: 'personal' })
  if (accepterWs) {
    const requesterUser = await User.findById(friendRecord.ownerId).lean() as any
    const existing = await Friend.findOne({
      workspaceId: accepterWs._id,
      friendUserId: friendRecord.ownerId,
    })
    if (!existing && requesterUser) {
      await Friend.create({
        workspaceId: accepterWs._id,
        ownerId: user.id,
        friendUserId: friendRecord.ownerId,
        email: requesterUser.email,
        status: 'accepted',
      })
    }
  }

  // 3. Send a 'friend_accepted' notification to the requester
  const accepterUser = await User.findById(user.id).lean() as any
  const accepterName = accepterUser
    ? `${accepterUser.firstName || ''} ${accepterUser.lastName || ''}`.trim() || accepterUser.email
    : 'Someone'

  await Notification.create({
    userId: friendRecord.ownerId,
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    message: `${accepterName} accepted your friend request`,
    metadata: {
      friendId: friendRecord._id.toString(),
      senderName: accepterName,
    },
    isRead: false,
  })

  return NextResponse.json({ success: true, message: 'Friend request accepted' })
}
