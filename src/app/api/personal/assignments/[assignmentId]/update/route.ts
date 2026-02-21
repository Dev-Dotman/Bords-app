import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

/**
 * PUT /api/personal/assignments/[assignmentId]/update
 * Update a personal assignment (move kanban column, edit content).
 * Only the assignee or assigner can update.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { assignmentId } = await params
  const body = await req.json()
  const { columnId, columnTitle, content } = body

  if (!columnId && !content) {
    return badRequest('At least one of columnId or content is required')
  }

  await connectDB()

  const assignment = await TaskAssignment.findOne({
    _id: assignmentId,
    contextType: 'personal',
    isDeleted: false,
  })

  if (!assignment) return notFound('Assignment')

  const isAssignee = assignment.assignedTo.toString() === user.id
  const isAssigner = assignment.assignedBy.toString() === user.id
  if (!isAssignee && !isAssigner) return forbidden()

  if (assignment.status === 'completed') {
    return NextResponse.json({ error: 'Cannot update a completed task' }, { status: 400 })
  }

  let notificationMessage = ''

  // Column move
  if (columnId && assignment.sourceType === 'kanban_task') {
    const oldCol = assignment.columnTitle || 'unknown'
    assignment.columnId = columnId
    assignment.columnTitle = columnTitle || columnId
    notificationMessage = `Task moved from "${oldCol}" to "${columnTitle || columnId}"`
  }

  // Content edit
  if (content && content.trim() !== assignment.content) {
    assignment.content = content.trim()
    notificationMessage = notificationMessage
      ? `${notificationMessage} and content updated`
      : 'Task content updated'
  }

  await assignment.save()

  // Notify the other party
  if (notificationMessage) {
    const notifyUserId = isAssignee
      ? assignment.assignedBy.toString()
      : assignment.assignedTo.toString()

    if (notifyUserId !== user.id) {
      const actor = await User.findById(user.id).select('firstName lastName').lean() as any
      const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Someone'

      await Notification.create({
        userId: notifyUserId,
        type: 'task_updated',
        title: 'Task Updated',
        message: `${actorName}: ${notificationMessage} — "${assignment.content.substring(0, 60)}"`,
        metadata: {
          taskAssignmentId: assignment._id.toString(),
          sourceType: assignment.sourceType,
          sourceId: assignment.sourceId,
        },
      })
    }
  }

  return NextResponse.json({
    task: {
      _id: assignment._id.toString(),
      columnId: assignment.columnId,
      columnTitle: assignment.columnTitle,
      content: assignment.content,
    },
  })
}
