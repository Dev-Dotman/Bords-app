import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import Friend from '@/models/Friend'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { getAuthUser, unauthorized, badRequest } from '@/lib/api-helpers'

/**
 * GET /api/assignments/personal — list personal friend assignments for the current user
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  // Fetch all personal assignments created by this user
  const assignments = await TaskAssignment.find({
    assignedBy: user.id,
    contextType: 'personal',
    isDeleted: false,
  })
    .populate('assignedTo', 'email firstName lastName image')
    .populate('assignedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({
    assignments: assignments.map((a: any) => ({
      _id: a._id.toString(),
      bordId: null,
      sourceType: a.sourceType,
      sourceId: a.sourceId,
      content: a.content,
      assignedTo: a.assignedTo?._id?.toString() || a.assignedTo?.toString(),
      assignedBy: a.assignedBy?._id?.toString() || a.assignedBy?.toString(),
      priority: a.priority,
      dueDate: a.dueDate?.toISOString() || null,
      executionNote: a.executionNote,
      status: a.status,
      publishedAt: a.publishedAt?.toISOString() || null,
      completedAt: a.completedAt?.toISOString() || null,
      isDeleted: a.isDeleted,
      columnId: a.columnId || null,
      columnTitle: a.columnTitle || null,
      availableColumns: a.availableColumns || [],
      contextType: 'personal',
      createdAt: a.createdAt?.toISOString(),
      assignee: a.assignedTo?._id ? {
        _id: a.assignedTo._id.toString(),
        email: a.assignedTo.email,
        firstName: a.assignedTo.firstName,
        lastName: a.assignedTo.lastName,
        image: a.assignedTo.image,
      } : undefined,
    })),
  })
}

/**
 * POST /api/assignments/personal — create a personal friend assignment
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const body = await req.json()
  const {
    sourceType,
    sourceId,
    content,
    assignedTo,
    priority,
    dueDate,
    executionNote,
    columnId,
    columnTitle,
    availableColumns,
    workspaceId,
  } = body

  if (!sourceType || !sourceId || !content?.trim() || !assignedTo) {
    return badRequest('sourceType, sourceId, content, and assignedTo are required')
  }

  await connectDB()

  // Validate that assignedTo is an accepted friend
  const friendship = await Friend.findOne({
    friendUserId: assignedTo,
    status: 'accepted',
  }).lean()

  if (!friendship) {
    return NextResponse.json(
      { error: 'You can only assign tasks to accepted friends' },
      { status: 400 }
    )
  }

  // For kanban tasks: only one person can be assigned at a time
  if (sourceType === 'kanban_task') {
    const existing = await TaskAssignment.findOne({
      assignedBy: user.id,
      contextType: 'personal',
      sourceType,
      sourceId,
      isDeleted: false,
      status: { $ne: 'completed' },
    })
    if (existing && existing.assignedTo.toString() !== assignedTo) {
      return NextResponse.json(
        { error: 'Kanban tasks can only be assigned to one person. Remove the current assignee first.' },
        { status: 400 }
      )
    }
  }

  // Check for existing active assignment for same person + source
  const existingAssignment = await TaskAssignment.findOne({
    assignedBy: user.id,
    contextType: 'personal',
    sourceType,
    sourceId,
    assignedTo,
    isDeleted: false,
    status: { $ne: 'completed' },
  })

  if (existingAssignment) {
    existingAssignment.content = content.trim()
    existingAssignment.priority = priority || 'normal'
    existingAssignment.dueDate = dueDate ? new Date(dueDate) : null
    existingAssignment.executionNote = executionNote || null
    if (columnId !== undefined) existingAssignment.columnId = columnId || null
    if (columnTitle !== undefined) existingAssignment.columnTitle = columnTitle || null
    if (availableColumns) existingAssignment.availableColumns = availableColumns
    existingAssignment.status = 'assigned'
    existingAssignment.publishedAt = new Date()
    await existingAssignment.save()

    // Create notification for the assignee
    if (assignedTo !== user.id) {
      const sender = await User.findById(user.id).select('firstName lastName').lean() as any
      const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone'
      await Notification.create({
        userId: assignedTo,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${senderName} assigned you a task: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
        metadata: {
          taskAssignmentId: existingAssignment._id.toString(),
          sourceType,
          sourceId,
        },
      })
    }

    return NextResponse.json({
      assignment: {
        _id: existingAssignment._id.toString(),
        bordId: null,
        sourceType: existingAssignment.sourceType,
        sourceId: existingAssignment.sourceId,
        content: existingAssignment.content,
        assignedTo: existingAssignment.assignedTo.toString(),
        assignedBy: existingAssignment.assignedBy.toString(),
        priority: existingAssignment.priority,
        dueDate: existingAssignment.dueDate?.toISOString() || null,
        executionNote: existingAssignment.executionNote,
        status: existingAssignment.status,
        contextType: 'personal',
        createdAt: existingAssignment.createdAt?.toISOString(),
      },
    })
  }

  const assignment = await TaskAssignment.create({
    bordId: null,
    contextType: 'personal',
    workspaceId: workspaceId || undefined,
    sourceType,
    sourceId,
    content: content.trim(),
    assignedTo,
    assignedBy: user.id,
    priority: priority || 'normal',
    dueDate: dueDate ? new Date(dueDate) : null,
    executionNote: executionNote || null,
    status: 'assigned',
    publishedAt: new Date(),
    columnId: columnId || null,
    columnTitle: columnTitle || null,
    availableColumns: availableColumns || [],
  })

  // Create notification for the assignee
  if (assignedTo !== user.id) {
    const sender = await User.findById(user.id).select('firstName lastName').lean() as any
    const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone'
    await Notification.create({
      userId: assignedTo,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${senderName} assigned you a task: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
      metadata: {
        taskAssignmentId: assignment._id.toString(),
        sourceType,
        sourceId,
      },
    })
  }

  return NextResponse.json({
    assignment: {
      _id: assignment._id.toString(),
      bordId: null,
      sourceType: assignment.sourceType,
      sourceId: assignment.sourceId,
      content: assignment.content,
      assignedTo: assignment.assignedTo.toString(),
      assignedBy: assignment.assignedBy.toString(),
      priority: assignment.priority,
      dueDate: assignment.dueDate?.toISOString() || null,
      executionNote: assignment.executionNote,
      status: assignment.status,
      contextType: 'personal',
      createdAt: assignment.createdAt?.toISOString(),
    },
  }, { status: 201 })
}
