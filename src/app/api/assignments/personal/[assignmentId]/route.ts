import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-helpers'

/**
 * DELETE /api/assignments/personal/[assignmentId] — soft-delete a personal assignment
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { assignmentId } = await params
  await connectDB()

  const assignment = await TaskAssignment.findById(assignmentId)
  if (!assignment) return notFound('Assignment')
  if (assignment.assignedBy.toString() !== user.id) return forbidden()
  if (assignment.contextType !== 'personal') return forbidden()

  assignment.isDeleted = true
  await assignment.save()

  return NextResponse.json({ success: true })
}
