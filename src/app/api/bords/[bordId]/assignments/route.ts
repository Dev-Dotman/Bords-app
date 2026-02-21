import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Bord from '@/models/Bord'
import TaskAssignment from '@/models/TaskAssignment'
import UnpublishedChangeTracker from '@/models/UnpublishedChangeTracker'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

// GET /api/bords/[bordId]/assignments — list assignments for a bord
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId } = await params
  await connectDB()

  const bord = await Bord.findById(bordId).lean()
  if (!bord) return notFound('Bord')
  if (bord.ownerId.toString() !== user.id) return forbidden()

  const assignments = await TaskAssignment.find({ bordId, isDeleted: false })
    .populate('assignedTo', 'email firstName lastName image')
    .populate('assignedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean()

  const tracker = await UnpublishedChangeTracker.findOne({ bordId }).lean()

  return NextResponse.json({
    assignments: assignments.map((a: any) => ({
      _id: a._id.toString(),
      bordId: a.bordId.toString(),
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
      employeeUpdates: a.employeeUpdates?.updatedAt ? {
        content: a.employeeUpdates.content,
        columnId: a.employeeUpdates.columnId,
        columnTitle: a.employeeUpdates.columnTitle,
        updatedAt: a.employeeUpdates.updatedAt?.toISOString() || null,
      } : undefined,
      createdAt: a.createdAt?.toISOString(),
      assignee: a.assignedTo?._id ? {
        _id: a.assignedTo._id.toString(),
        email: a.assignedTo.email,
        firstName: a.assignedTo.firstName,
        lastName: a.assignedTo.lastName,
        image: a.assignedTo.image,
      } : undefined,
      assigner: a.assignedBy?._id ? {
        _id: a.assignedBy._id.toString(),
        firstName: a.assignedBy.firstName,
        lastName: a.assignedBy.lastName,
      } : undefined,
    })),
    unpublishedChanges: tracker
      ? { changeCount: tracker.changeCount, lastModifiedAt: tracker.lastModifiedAt?.toISOString() }
      : { changeCount: 0, lastModifiedAt: null },
  })
}

// POST /api/bords/[bordId]/assignments — create a new assignment (draft)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId } = await params
  const body = await req.json()
  const { sourceType, sourceId, content, assignedTo, priority, dueDate, executionNote, columnId, columnTitle, availableColumns } = body

  if (!sourceType || !sourceId || !content?.trim() || !assignedTo) {
    return badRequest('sourceType, sourceId, content, and assignedTo are required')
  }

  await connectDB()

  const bord = await Bord.findById(bordId).lean()
  if (!bord) return notFound('Bord')
  if (bord.ownerId.toString() !== user.id) return forbidden()

  // For kanban tasks: only one employee can be assigned at a time
  if (sourceType === 'kanban_task') {
    const existingKanbanAssignment = await TaskAssignment.findOne({
      bordId,
      sourceType,
      sourceId,
      isDeleted: false,
      status: { $ne: 'completed' },
    })
    if (existingKanbanAssignment && existingKanbanAssignment.assignedTo.toString() !== assignedTo) {
      return NextResponse.json(
        { error: 'Kanban tasks can only be assigned to one employee. Remove the current assignee first.' },
        { status: 400 }
      )
    }
  }

  // Check if this exact employee already has an active assignment on this source
  const existingAssignment = await TaskAssignment.findOne({
    bordId,
    sourceType,
    sourceId,
    assignedTo,
    isDeleted: false,
    status: { $ne: 'completed' },
  })

  if (existingAssignment) {
    // Same employee re-assigned — update existing
    existingAssignment.content = content.trim()
    existingAssignment.priority = priority || 'normal'
    existingAssignment.dueDate = dueDate ? new Date(dueDate) : null
    existingAssignment.executionNote = executionNote || null
    if (columnId !== undefined) existingAssignment.columnId = columnId || null
    if (columnTitle !== undefined) existingAssignment.columnTitle = columnTitle || null
    if (availableColumns) existingAssignment.availableColumns = availableColumns
    existingAssignment.status = 'draft'
    existingAssignment.publishedAt = null
    await existingAssignment.save()

    await UnpublishedChangeTracker.findOneAndUpdate(
      { bordId },
      { $inc: { changeCount: 1 }, lastModifiedAt: new Date() },
      { upsert: true }
    )

    return NextResponse.json({
      assignment: {
        _id: existingAssignment._id.toString(),
        bordId: existingAssignment.bordId?.toString() || bordId,
        sourceType: existingAssignment.sourceType,
        sourceId: existingAssignment.sourceId,
        content: existingAssignment.content,
        assignedTo: existingAssignment.assignedTo.toString(),
        assignedBy: existingAssignment.assignedBy.toString(),
        priority: existingAssignment.priority,
        dueDate: existingAssignment.dueDate?.toISOString() || null,
        executionNote: existingAssignment.executionNote,
        status: existingAssignment.status,
        createdAt: existingAssignment.createdAt?.toISOString(),
      },
    })
  }

  const assignment = await TaskAssignment.create({
    bordId,
    sourceType,
    sourceId,
    content: content.trim(),
    assignedTo,
    assignedBy: user.id,
    priority: priority || 'normal',
    dueDate: dueDate ? new Date(dueDate) : null,
    executionNote: executionNote || null,
    status: 'draft',
    columnId: columnId || null,
    columnTitle: columnTitle || null,
    availableColumns: availableColumns || [],
  })

  await UnpublishedChangeTracker.findOneAndUpdate(
    { bordId },
    { $inc: { changeCount: 1 }, lastModifiedAt: new Date() },
    { upsert: true }
  )

  return NextResponse.json({
    assignment: {
      _id: assignment._id.toString(),
      bordId: assignment.bordId?.toString() || bordId,
      sourceType: assignment.sourceType,
      sourceId: assignment.sourceId,
      content: assignment.content,
      assignedTo: assignment.assignedTo.toString(),
      assignedBy: assignment.assignedBy.toString(),
      priority: assignment.priority,
      dueDate: assignment.dueDate?.toISOString() || null,
      executionNote: assignment.executionNote,
      status: assignment.status,
      createdAt: assignment.createdAt?.toISOString(),
    },
  }, { status: 201 })
}
