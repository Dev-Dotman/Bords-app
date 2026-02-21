import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import Bord from '@/models/Bord'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-helpers'

// POST /api/execution/tasks/[taskId]/complete — toggle task completion
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { taskId } = await params
  await connectDB()

  const assignment = await TaskAssignment.findById(taskId)
  if (!assignment) return notFound('Task')
  if (assignment.assignedTo.toString() !== user.id) return forbidden()

  const now = new Date()
  const wasCompleted = assignment.status === 'completed'

  if (wasCompleted) {
    // Uncomplete — revert to assigned
    assignment.status = 'assigned'
    assignment.completedAt = null
    await assignment.save()

    return NextResponse.json({
      task: {
        _id: assignment._id.toString(),
        status: 'assigned',
        completedAt: null,
      },
    })
  }

  // Complete
  assignment.status = 'completed'
  assignment.completedAt = now
  await assignment.save()

  // Notify the bord owner
  const bord = await Bord.findById(assignment.bordId).lean()
  if (bord) {
    await Notification.create({
      userId: bord.ownerId,
      type: 'task_completed',
      title: 'Task Completed',
      message: `A task has been completed in "${bord.title}": "${assignment.content.substring(0, 80)}"`,
      metadata: {
        bordId: bord._id.toString(),
        taskAssignmentId: assignment._id.toString(),
        bordTitle: bord.title,
        organizationId: bord.organizationId?.toString(),
        sourceType: assignment.sourceType,
        sourceId: assignment.sourceId,
      },
    })
  }

  return NextResponse.json({
    task: {
      _id: assignment._id.toString(),
      status: 'completed',
      completedAt: now.toISOString(),
    },
  })
}
