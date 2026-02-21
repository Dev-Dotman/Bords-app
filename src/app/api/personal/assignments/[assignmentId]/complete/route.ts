import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-helpers'

/**
 * POST /api/personal/assignments/[assignmentId]/complete
 * Toggle completion of a personal assignment (reminder).
 * assigned ↔ completed
 */
export async function POST(
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

  // Only assignee or assigner can toggle
  const isAssignee = task.assignedTo.toString() === user.id
  const isAssigner = task.assignedBy.toString() === user.id
  if (!isAssignee && !isAssigner) return forbidden()

  // Toggle status
  if (task.status === 'completed') {
    task.status = 'assigned'
    task.completedAt = null
  } else {
    task.status = 'completed'
    task.completedAt = new Date()
  }

  await task.save()

  // Notify the other party
  const notifyUserId = isAssignee
    ? task.assignedBy.toString()
    : task.assignedTo.toString()

  // Don't notify yourself
  if (notifyUserId !== user.id) {
    const actor = await User.findById(user.id).select('firstName lastName').lean()
    const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Someone'

    if (task.status === 'completed') {
      await Notification.create({
        userId: notifyUserId,
        type: 'task_completed',
        title: 'Reminder Completed',
        message: `${actorName} completed: "${task.content.substring(0, 60)}${task.content.length > 60 ? '...' : ''}"`,
        metadata: {
          taskAssignmentId: task._id.toString(),
          sourceType: task.sourceType,
          sourceId: task.sourceId,
        },
      })
    }
  }

  return NextResponse.json({ assignment: task })
}
