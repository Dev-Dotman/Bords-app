import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Workspace from '@/models/Workspace'
import Friend from '@/models/Friend'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-helpers'

/**
 * DELETE /api/workspaces/friends/[friendId]
 * Remove a friend from the personal workspace.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { friendId } = await params

  await connectDB()

  const personalWs = await Workspace.findOne({
    ownerId: user.id,
    type: 'personal',
  })
  if (!personalWs) return notFound('Personal workspace')

  const friend = await Friend.findOne({
    _id: friendId,
    workspaceId: personalWs._id,
  })
  if (!friend) return notFound('Friend')
  if (friend.ownerId.toString() !== user.id) return forbidden()

  // Capture friend userId before deleting
  const friendUserId = friend.friendUserId.toString()

  await Friend.deleteOne({ _id: friendId })

  // Also delete the reciprocal Friend record (if one exists)
  // The friend may have their own Friend record pointing back at us
  const reciprocalFriend = await Friend.findOne({
    ownerId: friendUserId,
    friendUserId: user.id,
  })
  if (reciprocalFriend) {
    await Friend.deleteOne({ _id: reciprocalFriend._id })
  }

  // Notify the removed friend
  if (friendUserId !== user.id) {
    const remover = await User.findById(user.id).select('firstName lastName').lean() as any
    const removerName = remover
      ? `${remover.firstName || ''} ${remover.lastName || ''}`.trim() || 'Someone'
      : 'Someone'

    await Notification.create({
      userId: friendUserId,
      type: 'friend_removed',
      title: 'Friend Removed',
      message: `${removerName} removed you from their friends list`,
      metadata: {
        senderName: removerName,
      },
      isRead: false,
    })
  }

  return NextResponse.json({ success: true })
}
