import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import Bord from '@/models/Bord'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

// PUT /api/execution/tasks/[taskId]/update — employee updates a task (move column, edit content)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { taskId } = await params
  const body = await req.json()
  const { columnId, columnTitle, content } = body

  if (!columnId && !content) {
    return badRequest('At least one of columnId or content is required')
  }

  await connectDB()

  const assignment = await TaskAssignment.findById(taskId)
  if (!assignment) return notFound('Task')
  if (assignment.assignedTo.toString() !== user.id) return forbidden()
  if (assignment.status === 'completed') {
    return NextResponse.json({ error: 'Cannot update a completed task' }, { status: 400 })
  }

  let notificationMessage = ''

  // Column move
  if (columnId && assignment.sourceType === 'kanban_task') {
    const oldCol = assignment.columnTitle || 'unknown'
    // Update top-level column fields so the API response reflects the new column
    assignment.columnId = columnId
    assignment.columnTitle = columnTitle || columnId
    // Also store in employeeUpdates so the owner can sync the change
    assignment.employeeUpdates = {
      ...assignment.employeeUpdates,
      columnId,
      columnTitle: columnTitle || columnId,
      updatedAt: new Date(),
    } as any
    notificationMessage = `Task moved from "${oldCol}" to "${columnTitle || columnId}"`
  }

  // Content edit
  if (content && content.trim() !== assignment.content) {
    assignment.employeeUpdates = {
      ...assignment.employeeUpdates,
      content: content.trim(),
      updatedAt: new Date(),
    } as any
    notificationMessage = notificationMessage
      ? `${notificationMessage} and content updated`
      : 'Task content updated'
  }

  assignment.markModified('employeeUpdates')
  await assignment.save()

  // Notify the bord owner about the update
  if (notificationMessage) {
    const bord = await Bord.findById(assignment.bordId).lean()
    if (bord) {
      await Notification.create({
        userId: bord.ownerId,
        type: 'task_updated' as any,
        title: 'Task Updated',
        message: `${notificationMessage} in "${bord.title}": "${assignment.content.substring(0, 60)}"`,
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
  }

  return NextResponse.json({
    task: {
      _id: assignment._id.toString(),
      columnId: assignment.employeeUpdates?.columnId || assignment.columnId,
      columnTitle: assignment.employeeUpdates?.columnTitle || assignment.columnTitle,
      employeeUpdates: {
        content: assignment.employeeUpdates?.content,
        columnId: assignment.employeeUpdates?.columnId,
        columnTitle: assignment.employeeUpdates?.columnTitle,
        updatedAt: assignment.employeeUpdates?.updatedAt?.toISOString(),
      },
    },
  })
}
