import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Bord from '@/models/Bord'
import TaskAssignment from '@/models/TaskAssignment'
import UnpublishedChangeTracker from '@/models/UnpublishedChangeTracker'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

// PUT /api/bords/[bordId]/assignments/[assignmentId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string; assignmentId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId, assignmentId } = await params
  const body = await req.json()

  await connectDB()

  const bord = await Bord.findById(bordId).lean()
  if (!bord) return notFound('Bord')
  if (bord.ownerId.toString() !== user.id) return forbidden()

  const assignment = await TaskAssignment.findOne({ _id: assignmentId, bordId })
  if (!assignment) return notFound('Assignment')

  const allowedFields = ['content', 'assignedTo', 'priority', 'dueDate', 'executionNote']
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'dueDate') {
        (assignment as any)[field] = body[field] ? new Date(body[field]) : null
      } else {
        (assignment as any)[field] = body[field]
      }
    }
  }

  // If assignment was already published, mark as draft again
  if (assignment.status === 'assigned') {
    assignment.status = 'draft'
    assignment.publishedAt = null
  }

  await assignment.save()

  await UnpublishedChangeTracker.findOneAndUpdate(
    { bordId },
    { $inc: { changeCount: 1 }, lastModifiedAt: new Date() },
    { upsert: true }
  )

  return NextResponse.json({
    assignment: {
      _id: assignment._id.toString(),
      bordId: assignment.bordId.toString(),
      sourceType: assignment.sourceType,
      sourceId: assignment.sourceId,
      content: assignment.content,
      assignedTo: assignment.assignedTo.toString(),
      priority: assignment.priority,
      dueDate: assignment.dueDate?.toISOString() || null,
      executionNote: assignment.executionNote,
      status: assignment.status,
    },
  })
}

// DELETE /api/bords/[bordId]/assignments/[assignmentId] — soft-delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string; assignmentId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId, assignmentId } = await params

  await connectDB()

  const bord = await Bord.findById(bordId).lean()
  if (!bord) return notFound('Bord')
  if (bord.ownerId.toString() !== user.id) return forbidden()

  const assignment = await TaskAssignment.findOne({ _id: assignmentId, bordId })
  if (!assignment) return notFound('Assignment')

  assignment.isDeleted = true
  await assignment.save()

  await UnpublishedChangeTracker.findOneAndUpdate(
    { bordId },
    { $inc: { changeCount: 1 }, lastModifiedAt: new Date() },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}
