import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized } from '@/lib/api-helpers'

// GET /api/notifications — get notifications for current user
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  const notifications = await Notification.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  return NextResponse.json({
    notifications: notifications.map((n: any) => ({
      _id: n._id.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      isRead: n.isRead,
      createdAt: n.createdAt?.toISOString(),
    })),
    unreadCount: notifications.filter((n: any) => !n.isRead).length,
  })
}

// PUT /api/notifications — mark notifications as read
export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const body = await req.json()
  const { notificationIds, markAllRead } = body

  await connectDB()

  if (markAllRead) {
    await Notification.updateMany(
      { userId: user.id, isRead: false },
      { isRead: true }
    )
  } else if (notificationIds?.length) {
    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: user.id },
      { isRead: true }
    )
  }

  return NextResponse.json({ success: true })
}
