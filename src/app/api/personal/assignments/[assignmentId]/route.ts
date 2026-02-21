import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

/**
 * PUT /api/personal/assignments/[assignmentId]
 * Update a personal assignment.
 * No draft→publish — changes are immediate.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { assignmentId } = await params
  const body = await req.json()

  await connectDB()

  const task = await TaskAssignment.findOne({
    _id: assignmentId,
    contextType: 'personal',
    isDeleted: false,
  })
  if (!task) return notFound('Assignment')

  // Only the assigner can edit
  if (task.assignedBy.toString() !== user.id) return forbidden()

  const { content, dueDate, executionNote } = body

  if (content !== undefined) task.content = content
  if (dueDate !== undefined) task.dueDate = dueDate
  if (executionNote !== undefined) task.executionNote = executionNote

  await task.save()

  return NextResponse.json({ assignment: task })
}

/**
 * DELETE /api/personal/assignments/[assignmentId]
 * Soft-delete a personal assignment.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { assignmentId } = await params

  await connectDB()

  const task = await TaskAssignment.findOne({
    _id: assignmentId,
    contextType: 'personal',
    isDeleted: false,
  })
  if (!task) return notFound('Assignment')

  // Only assigner can delete
  if (task.assignedBy.toString() !== user.id) return forbidden()

  task.isDeleted = true
  await task.save()

  return NextResponse.json({ success: true })
}
