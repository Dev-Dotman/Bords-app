import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Workspace from '@/models/Workspace'
import TaskAssignment from '@/models/TaskAssignment'
import Notification from '@/models/Notification'
import BoardDocument from '@/models/BoardDocument'
import User from '@/models/User'
import Friend from '@/models/Friend'
import { getAuthUser, unauthorized, badRequest, notFound } from '@/lib/api-helpers'

/**
 * GET /api/personal/assignments
 * List personal assignments (reminders).
 * - Self-assigned tasks
 * - Tasks assigned to the user by friends
 * - Tasks the user sent to friends
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'all' // all | received | sent

  let query: any = {
    contextType: 'personal',
    isDeleted: false,
  }

  if (filter === 'received') {
    query.assignedTo = user.id
  } else if (filter === 'sent') {
    query.assignedBy = user.id
  } else {
    // all: tasks assigned to me or by me
    query.$or = [
      { assignedTo: user.id },
      { assignedBy: user.id },
    ]
  }

  const tasks = await TaskAssignment.find(query)
    .populate('assignedTo', 'firstName lastName email image')
    .populate('assignedBy', 'firstName lastName email image')
    .sort({ createdAt: -1 })
    .lean()

  // Get board names for tasks that have a boardLocalId context
  const boardIds = [...new Set(tasks.filter(t => t.bordId).map(t => t.bordId!.toString()))]

  return NextResponse.json({
    tasks: tasks.map(t => ({
      _id: t._id,
      content: t.content,
      sourceType: t.sourceType,
      sourceId: t.sourceId,
      assignedTo: t.assignedTo,
      assignedBy: t.assignedBy,
      priority: t.priority,
      dueDate: t.dueDate,
      executionNote: t.executionNote,
      status: t.status,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
      contextType: 'personal',
    })),
  })
}

/**
 * POST /api/personal/assignments
 * Create a personal assignment (reminder).
 * 
 * Personal mode: IMMEDIATE write, no draft state, no publish flow.
 * Status is set directly to 'assigned'.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  const body = await req.json()
  const {
    sourceType,
    sourceId,
    content,
    assignedTo,    // user ID of recipient (self or friend)
    dueDate,
    executionNote,
    boardLocalId,  // optional: local board context
  } = body

  if (!sourceType || !sourceId || !content) {
    return badRequest('sourceType, sourceId, and content are required')
  }

  // Find personal workspace
  const personalWs = await Workspace.findOne({
    ownerId: user.id,
    type: 'personal',
  })
  if (!personalWs) return notFound('Personal workspace')

  // Determine recipient
  const recipientId = assignedTo || user.id
  const isSelfAssigned = recipientId === user.id

  // If assigning to someone else, verify they're a friend
  if (!isSelfAssigned) {
    const friendship = await Friend.findOne({
      workspaceId: personalWs._id,
      friendUserId: recipientId,
    })
    if (!friendship) {
      return badRequest('You can only assign personal tasks to yourself or your friends')
    }
  }

  // Create assignment — IMMEDIATELY as 'assigned' (no draft)
  const assignment = await TaskAssignment.create({
    bordId: null, // personal tasks don't require a Bord link
    workspaceId: personalWs._id,
    organizationId: undefined,
    contextType: 'personal',
    sourceType,
    sourceId,
    content,
    assignedTo: recipientId,
    assignedBy: user.id,
    priority: 'normal', // Personal mode: no priority required
    dueDate: dueDate || null,
    executionNote: executionNote || null,
    status: 'assigned', // IMMEDIATE — no draft
    publishedAt: new Date(),
  })

  // Create notification for recipient (if not self-assigned)
  if (!isSelfAssigned) {
    const sender = await User.findById(user.id).select('firstName lastName').lean()
    const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone'

    await Notification.create({
      userId: recipientId,
      type: 'task_assigned',
      title: 'New Personal Reminder',
      message: `${senderName} sent you a reminder: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
      metadata: {
        taskAssignmentId: assignment._id.toString(),
        sourceType,
        sourceId,
      },
    })
  }

  return NextResponse.json({ assignment }, { status: 201 })
}
