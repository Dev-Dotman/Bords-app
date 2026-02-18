import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Bord from '@/models/Bord'
import TaskAssignment from '@/models/TaskAssignment'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

/**
 * POST /api/bords/[bordId]/assignments/owner-sync
 *
 * Owner-side sync: when the board owner manually toggles a checklist item
 * or moves a kanban task between columns, keep the corresponding
 * TaskAssignment documents in sync.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId } = await params
  const body = await req.json()
  const { sourceType, sourceId, action, completed, columnId, columnTitle } = body

  if (!sourceType || !sourceId || !action) {
    return badRequest('sourceType, sourceId, and action are required')
  }

  await connectDB()

  const bord = await Bord.findById(bordId).lean()
  if (!bord) return notFound('Bord')
  if ((bord as any).ownerId.toString() !== user.id) return forbidden()

  // Find all active (non-deleted) assignments for this source item
  const assignments = await TaskAssignment.find({
    bordId,
    sourceType,
    sourceId,
    isDeleted: { $ne: true },
  })

  if (assignments.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  let updated = 0

  for (const assignment of assignments) {
    if (action === 'toggle_complete') {
      // Only sync assignments that have been published (assigned) or already completed
      if (assignment.status === 'assigned' || assignment.status === 'completed') {
        assignment.status = completed ? 'completed' : 'assigned'
        await assignment.save()
        updated++
      }
    } else if (action === 'move_column') {
      // Update the column tracked on the assignment
      if (columnId) {
        assignment.columnId = columnId
        assignment.columnTitle = columnTitle || null
        await assignment.save()
        updated++
      }
    }
  }

  return NextResponse.json({ updated })
}
