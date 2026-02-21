import connectDB from '@/lib/mongodb'
import TaskAssignment from '@/models/TaskAssignment'
import Notification from '@/models/Notification'
import BoardDocument from '@/models/BoardDocument'
import User from '@/models/User'
import Workspace from '@/models/Workspace'

/**
 * Shared helper: Create inbox entries (TaskAssignment + Notification) when a
 * reminder email fires — used by both client-side /api/reminders/send and
 * server-side /api/cron/check-reminders.
 *
 * Rules:
 * - Personal board → entry in personal inbox
 * - Organization board → entry in work inbox
 * - Organization board AND the recipient is the owner → entries in BOTH personal + work inboxes
 * - Friend/team member → entry in their respective inbox
 * - Dedup: won't create duplicate entries for the same item + interval
 */

export interface CreateReminderInboxParams {
  /** 'checklist' | 'kanban' | 'reminder' */
  source: string
  /** The parent container title (checklist title, kanban board title, etc.) */
  parentTitle: string
  /** The specific item text */
  itemText: string
  /** Unique item ID (checklist item id, kanban task id, reminder item id) */
  itemId: string
  /** Time label: '30 minutes', '10 minutes', '5 minutes', 'overdue', 'manual' */
  timeRemaining: string
  /** The user ID who owns the board / triggered the reminder */
  senderId: string
  /** The recipient user ID */
  recipientId: string
  /** The recipient email (for lookup if recipientId not known) */
  recipientEmail?: string
  /** Due date for the item (optional) */
  dueDate?: Date | null
  /** BoardDocument._id (optional — needed for org context detection) */
  boardDocId?: string
}

export async function createReminderInboxEntry(params: CreateReminderInboxParams) {
  const {
    source, parentTitle, itemText, itemId, timeRemaining,
    senderId, recipientId, recipientEmail, dueDate, boardDocId,
  } = params

  await connectDB()

  // Map source to TaskAssignment sourceType
  const sourceTypeMap: Record<string, string> = {
    checklist: 'checklist_item',
    kanban: 'kanban_task',
    reminder: 'reminder_item',
  }
  const sourceType = sourceTypeMap[source] || 'reminder_item'

  // ── Dedup: Don't create duplicate inbox entries for the same item + interval ──
  const dedupSourceId = `${itemId}::${timeRemaining}`
  const existingEntry = await TaskAssignment.findOne({
    sourceType,
    sourceId: dedupSourceId,
    assignedTo: recipientId,
    isDeleted: false,
  })
  if (existingEntry) return { created: false, reason: 'duplicate' }

  // ── Determine context (personal vs organization) ──
  let contextType: 'personal' | 'organization' = 'personal'
  let organizationId: string | null = null
  let workspaceId: string | null = null
  let boardDoc: any = null

  if (boardDocId) {
    boardDoc = await BoardDocument.findById(boardDocId)
      .select('contextType organizationId workspaceId owner')
      .lean()
    if (boardDoc) {
      contextType = boardDoc.contextType || 'personal'
      organizationId = boardDoc.organizationId?.toString() || null
      workspaceId = boardDoc.workspaceId?.toString() || null
    }
  }

  // If no board context or personal, get the recipient's personal workspace
  if (!workspaceId && contextType === 'personal') {
    const personalWs = await Workspace.findOne({ ownerId: recipientId, type: 'personal' }).lean()
    if (personalWs) workspaceId = (personalWs._id as any).toString()
  }

  const isOverdue = timeRemaining === 'overdue'
  const notificationType = isOverdue ? 'reminder_overdue' : 'reminder_due'
  const content = `${parentTitle}: ${itemText}`

  // Get sender name for notification message
  const sender = await User.findById(senderId).select('firstName lastName').lean() as any
  const senderName = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'Bords'

  const isSelfAssigned = senderId === recipientId
  const isOrgBoard = contextType === 'organization'
  const isOwnerOfOrgBoard = isOrgBoard && boardDoc?.owner?.toString() === recipientId

  const created: string[] = []

  // ── Create work inbox entry (for org boards) ──
  if (isOrgBoard) {
    const orgEntry = await TaskAssignment.create({
      bordId: null,
      workspaceId: workspaceId || undefined,
      organizationId: organizationId || undefined,
      contextType: 'organization',
      sourceType,
      sourceId: dedupSourceId,
      content,
      assignedTo: recipientId,
      assignedBy: senderId,
      priority: isOverdue ? 'high' : 'normal',
      dueDate: dueDate || null,
      executionNote: isOverdue
        ? `⚠️ Deadline reached for: ${itemText}`
        : `⏰ Due in ${timeRemaining}: ${itemText}`,
      status: 'assigned',
      publishedAt: new Date(),
    })
    created.push('organization')

    // Notification for work inbox
    await Notification.create({
      userId: recipientId,
      type: notificationType,
      title: isOverdue ? `⚠️ Overdue: ${itemText}` : `⏰ Due in ${timeRemaining}: ${itemText}`,
      message: isSelfAssigned
        ? `Your ${source} item "${itemText}" in "${parentTitle}" is ${isOverdue ? 'overdue' : `due in ${timeRemaining}`}`
        : `${senderName}'s ${source} item "${itemText}" in "${parentTitle}" is ${isOverdue ? 'overdue' : `due in ${timeRemaining}`}`,
      metadata: {
        taskAssignmentId: orgEntry._id.toString(),
        sourceType,
        sourceId: dedupSourceId,
        organizationId: organizationId || undefined,
      },
    })
  }

  // ── Create personal inbox entry ──
  // For personal boards: always
  // For org boards: only if the recipient IS the board owner (gets entry in both inboxes)
  if (!isOrgBoard || isOwnerOfOrgBoard) {
    // Get recipient's personal workspace for personal context
    let personalWsId = contextType === 'personal' ? workspaceId : null
    if (!personalWsId) {
      const personalWs = await Workspace.findOne({ ownerId: recipientId, type: 'personal' }).lean() as any
      if (personalWs) personalWsId = personalWs._id.toString()
    }

    const personalDedupId = isOrgBoard ? `${dedupSourceId}::personal` : dedupSourceId
    
    // Check dedup for personal entry separately (in case org entry was already created)
    const existingPersonal = isOrgBoard ? await TaskAssignment.findOne({
      sourceType,
      sourceId: personalDedupId,
      assignedTo: recipientId,
      contextType: 'personal',
      isDeleted: false,
    }) : null

    if (!existingPersonal) {
      const personalEntry = await TaskAssignment.create({
        bordId: null,
        workspaceId: personalWsId || undefined,
        organizationId: undefined,
        contextType: 'personal',
        sourceType,
        sourceId: isOrgBoard ? personalDedupId : dedupSourceId,
        content,
        assignedTo: recipientId,
        assignedBy: senderId,
        priority: isOverdue ? 'high' : 'normal',
        dueDate: dueDate || null,
        executionNote: isOverdue
          ? `⚠️ Deadline reached for: ${itemText}`
          : `⏰ Due in ${timeRemaining}: ${itemText}`,
        status: 'assigned',
        publishedAt: new Date(),
      })
      created.push('personal')

      // Notification for personal inbox (only if we didn't already notify for org)
      if (!isOrgBoard) {
        await Notification.create({
          userId: recipientId,
          type: notificationType,
          title: isOverdue ? `⚠️ Overdue: ${itemText}` : `⏰ Due in ${timeRemaining}: ${itemText}`,
          message: isSelfAssigned
            ? `Your ${source} item "${itemText}" in "${parentTitle}" is ${isOverdue ? 'overdue' : `due in ${timeRemaining}`}`
            : `${senderName} — ${source} item "${itemText}" in "${parentTitle}" is ${isOverdue ? 'overdue' : `due in ${timeRemaining}`}`,
          metadata: {
            taskAssignmentId: personalEntry._id.toString(),
            sourceType,
            sourceId: isOrgBoard ? personalDedupId : dedupSourceId,
          },
        })
      }
    }
  }

  return { created: true, inboxes: created }
}
