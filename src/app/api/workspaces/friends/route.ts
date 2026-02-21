import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Workspace from '@/models/Workspace'
import Friend from '@/models/Friend'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, badRequest, notFound } from '@/lib/api-helpers'

/**
 * GET /api/workspaces/friends
 * List all friends in the user's personal workspace.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  const personalWs = await Workspace.findOne({
    ownerId: user.id,
    type: 'personal',
  })

  if (!personalWs) {
    return NextResponse.json({ friends: [] })
  }

  const friends = await Friend.find({ workspaceId: personalWs._id })
    .populate('friendUserId', 'firstName lastName email image')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({
    friends: friends.map(f => ({
      _id: f._id,
      userId: (f.friendUserId as any)?._id || f.friendUserId,
      email: f.email,
      nickname: f.nickname,
      firstName: (f.friendUserId as any)?.firstName || '',
      lastName: (f.friendUserId as any)?.lastName || '',
      image: (f.friendUserId as any)?.image || '',
      status: f.status || 'accepted', // backward compat for existing records
    })),
  })
}

/**
 * POST /api/workspaces/friends
 * Add a friend by email to the personal workspace.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { email, nickname } = await req.json()
  if (!email?.trim()) return badRequest('Email is required')

  await connectDB()

  // Find personal workspace
  const personalWs = await Workspace.findOne({
    ownerId: user.id,
    type: 'personal',
  })
  if (!personalWs) return notFound('Personal workspace')

  // Find the friend user
  const friendUser = await User.findOne({ email: email.toLowerCase().trim() })
  if (!friendUser) {
    return badRequest('No user found with that email')
  }

  if (friendUser._id.toString() === user.id) {
    return badRequest('You cannot add yourself as a friend')
  }

  // Check if already a friend
  const existing = await Friend.findOne({
    workspaceId: personalWs._id,
    friendUserId: friendUser._id,
  })
  if (existing) {
    return badRequest('This person is already your friend')
  }

  const friend = await Friend.create({
    workspaceId: personalWs._id,
    ownerId: user.id,
    friendUserId: friendUser._id,
    email: friendUser.email,
    nickname: nickname?.trim() || null,
    status: 'pending',
  })

  // Send a friend request notification to the invited user
  const senderUser = await User.findById(user.id).lean() as any
  const senderName = senderUser
    ? `${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim() || senderUser.email
    : 'Someone'

  await Notification.create({
    userId: friendUser._id,
    type: 'friend_request',
    title: 'Friend Request',
    message: `${senderName} wants to add you as a friend`,
    metadata: {
      friendId: friend._id.toString(),
      senderName,
    },
    isRead: false,
  })

  return NextResponse.json({
    friend: {
      _id: friend._id,
      userId: friendUser._id,
      email: friendUser.email,
      nickname: friend.nickname,
      firstName: friendUser.firstName,
      lastName: friendUser.lastName,
      image: friendUser.image,
      status: friend.status,
    },
  }, { status: 201 })
}
