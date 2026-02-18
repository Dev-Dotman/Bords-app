import { create } from 'zustand'
import type {
  TaskAssignmentDTO,
  BordDTO,
  UnpublishedChanges,
  PublishResult,
  NotificationDTO,
} from '@/types/delegation'
import { useChecklistStore } from './checklistStore'
import { useKanbanStore } from './kanbanStore'

/**
 * Syncs completed assignments and employee updates back to local stores.
 * Called after fetching assignments so the owner's board reflects employee changes.
 */
function syncAssignmentsToLocalStores(assignments: TaskAssignmentDTO[]) {
  const checklistState = useChecklistStore.getState()
  const kanbanState = useKanbanStore.getState()

  for (const assignment of assignments) {
    if (assignment.isDeleted) continue

    // 1. Sync completed status
    if (assignment.status === 'completed') {
      if (assignment.sourceType === 'checklist_item') {
        for (const checklist of checklistState.checklists) {
          const item = checklist.items.find((i) => i.id === assignment.sourceId)
          if (item && !item.completed) {
            checklistState.updateItem(checklist.id, item.id, { completed: true })
            break
          }
        }
      } else if (assignment.sourceType === 'kanban_task') {
        for (const board of kanbanState.boards) {
          let found = false
          for (const col of board.columns) {
            const task = col.tasks.find((t) => t.id === assignment.sourceId)
            if (task && !task.completed) {
              kanbanState.updateTask(board.id, col.id, task.id, { completed: true })
              found = true
              break
            }
          }
          if (found) break
        }
      }
    }

    // 2. Sync employee updates (column moves for kanban tasks)
    if (assignment.employeeUpdates?.updatedAt && assignment.sourceType === 'kanban_task') {
      const targetColumnId = assignment.employeeUpdates.columnId
      if (targetColumnId) {
        for (const board of kanbanState.boards) {
          let found = false
          for (const col of board.columns) {
            const taskIndex = col.tasks.findIndex((t) => t.id === assignment.sourceId)
            if (taskIndex !== -1) {
              // Task is in this column — move it if it's not already in the target column
              if (col.id !== targetColumnId) {
                const targetCol = board.columns.find((c) => c.id === targetColumnId)
                if (targetCol) {
                  kanbanState.moveTask(board.id, assignment.sourceId, col.id, targetColumnId, targetCol.tasks.length)
                }
              }
              found = true
              break
            }
          }
          if (found) break
        }
      }

      // Sync content updates
      if (assignment.employeeUpdates.content) {
        for (const board of kanbanState.boards) {
          let found = false
          for (const col of board.columns) {
            const task = col.tasks.find((t) => t.id === assignment.sourceId)
            if (task && task.title !== assignment.employeeUpdates.content) {
              kanbanState.updateTask(board.id, col.id, task.id, { title: assignment.employeeUpdates.content })
              found = true
              break
            }
          }
          if (found) break
        }
      }
    }

    // 3. Sync employee content updates for checklist items
    if (assignment.employeeUpdates?.content && assignment.sourceType === 'checklist_item') {
      for (const checklist of checklistState.checklists) {
        const item = checklist.items.find((i) => i.id === assignment.sourceId)
        if (item && item.text !== assignment.employeeUpdates.content) {
          checklistState.updateItem(checklist.id, item.id, { text: assignment.employeeUpdates.content })
          break
        }
      }
    }
  }
}

interface DelegationStore {
  // Bords (server-side board references)
  bords: BordDTO[]
  currentBordId: string | null

  // Assignments for current bord
  assignments: TaskAssignmentDTO[]
  unpublishedChanges: UnpublishedChanges

  // Notifications
  notifications: NotificationDTO[]
  unreadCount: number

  // UI state
  isAssignModalOpen: boolean
  assignModalContext: {
    sourceType: 'note' | 'checklist_item' | 'kanban_task'
    sourceId: string
    content: string
    columnId?: string
    columnTitle?: string
    availableColumns?: { id: string; title: string }[]
  } | null
  isPublishing: boolean
  isLoading: boolean
  error: string | null

  // Bord actions
  fetchBords: () => Promise<void>
  linkBoardToOrg: (organizationId: string, localBoardId: string, title: string) => Promise<BordDTO | null>
  getBordForLocalBoard: (localBoardId: string) => BordDTO | undefined
  setCurrentBord: (bordId: string | null) => void

  // Assignment actions
  fetchAssignments: (bordId: string) => Promise<void>
  createAssignment: (
    bordId: string,
    data: {
      sourceType: 'note' | 'checklist_item' | 'kanban_task'
      sourceId: string
      content: string
      assignedTo: string
      priority?: 'low' | 'normal' | 'high'
      dueDate?: string
      executionNote?: string
      columnId?: string
      columnTitle?: string
      availableColumns?: { id: string; title: string }[]
    }
  ) => Promise<TaskAssignmentDTO | null>
  updateAssignment: (
    bordId: string,
    assignmentId: string,
    updates: Partial<TaskAssignmentDTO>
  ) => Promise<boolean>
  deleteAssignment: (bordId: string, assignmentId: string) => Promise<boolean>
  getAssignmentForSource: (sourceType: string, sourceId: string) => TaskAssignmentDTO | undefined
  getAssignmentsForSource: (sourceType: string, sourceId: string) => TaskAssignmentDTO[]

  // Publish
  publishBord: (bordId: string) => Promise<PublishResult | null>

  // Notifications
  fetchNotifications: () => Promise<void>
  markNotificationsRead: (ids?: string[]) => Promise<void>

  // Invitations
  acceptInvitation: (invitationId: string) => Promise<{ success: boolean; message?: string }>
  declineInvitation: (notificationId: string) => Promise<void>

  // Owner-side sync
  syncOwnerChecklistToggle: (itemId: string, completed: boolean) => void
  syncOwnerColumnMove: (taskId: string, columnId: string, columnTitle: string) => void

  // UI
  openAssignModal: (context: { sourceType: 'note' | 'checklist_item' | 'kanban_task'; sourceId: string; content: string; columnId?: string; columnTitle?: string; availableColumns?: { id: string; title: string }[] }) => void
  closeAssignModal: () => void
}

export const useDelegationStore = create<DelegationStore>((set, get) => ({
  bords: [],
  currentBordId: null,
  assignments: [],
  unpublishedChanges: { changeCount: 0, lastModifiedAt: null },
  notifications: [],
  unreadCount: 0,
  isAssignModalOpen: false,
  assignModalContext: null,
  isPublishing: false,
  isLoading: false,
  error: null,

  fetchBords: async () => {
    try {
      const res = await fetch('/api/bords')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ bords: data.bords })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  linkBoardToOrg: async (organizationId, localBoardId, title) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/bords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, localBoardId, title }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set((state) => {
        const existing = state.bords.find((b) => b._id === data.bord._id)
        if (existing) return state
        return { bords: [...state.bords, data.bord] }
      })
      return data.bord
    } catch (err: any) {
      set({ error: err.message })
      return null
    } finally {
      set({ isLoading: false })
    }
  },

  getBordForLocalBoard: (localBoardId) => {
    return get().bords.find((b) => b.localBoardId === localBoardId)
  },

  setCurrentBord: (bordId) => set({ currentBordId: bordId }),

  fetchAssignments: async (bordId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/bords/${bordId}/assignments`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({
        assignments: data.assignments,
        unpublishedChanges: data.unpublishedChanges,
      })
      // Sync assignments (completions, column moves, content updates) to local stores
      syncAssignmentsToLocalStores(data.assignments)
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  createAssignment: async (bordId, data) => {
    set({ error: null })
    try {
      const res = await fetch(`/api/bords/${bordId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      // Refresh assignments
      await get().fetchAssignments(bordId)
      return result.assignment
    } catch (err: any) {
      set({ error: err.message })
      return null
    }
  },

  updateAssignment: async (bordId, assignmentId, updates) => {
    set({ error: null })
    try {
      const res = await fetch(`/api/bords/${bordId}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      await get().fetchAssignments(bordId)
      return true
    } catch (err: any) {
      set({ error: err.message })
      return false
    }
  },

  deleteAssignment: async (bordId, assignmentId) => {
    set({ error: null })
    try {
      const res = await fetch(`/api/bords/${bordId}/assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== assignmentId),
      }))
      return true
    } catch (err: any) {
      set({ error: err.message })
      return false
    }
  },

  getAssignmentForSource: (sourceType, sourceId) => {
    return get().assignments.find(
      (a) => a.sourceType === sourceType && a.sourceId === sourceId && !a.isDeleted
    )
  },

  getAssignmentsForSource: (sourceType, sourceId) => {
    return get().assignments.filter(
      (a) => a.sourceType === sourceType && a.sourceId === sourceId && !a.isDeleted
    )
  },

  publishBord: async (bordId) => {
    set({ isPublishing: true, error: null })
    try {
      const res = await fetch(`/api/bords/${bordId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.warning)
      // Refresh assignments after publish
      await get().fetchAssignments(bordId)
      return data.publish
    } catch (err: any) {
      set({ error: err.message })
      return null
    } finally {
      set({ isPublishing: false })
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ notifications: data.notifications, unreadCount: data.unreadCount })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  markNotificationsRead: async (ids) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { notificationIds: ids } : { markAllRead: true }),
      })
      if (ids) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            ids.includes(n._id) ? { ...n, isRead: true } : n
          ),
          unreadCount: state.notifications.filter((n) => !n.isRead && !ids.includes(n._id)).length,
        }))
      } else {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }))
      }
    } catch {
      // silent fail
    }
  },

  // Fire-and-forget owner-side sync for checklist toggle
  syncOwnerChecklistToggle: (itemId, completed) => {
    const assignments = get().getAssignmentsForSource('checklist_item', itemId)
    if (assignments.length === 0) return
    const bordId = assignments[0].bordId
    fetch(`/api/bords/${bordId}/assignments/owner-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: 'checklist_item',
        sourceId: itemId,
        action: 'toggle_complete',
        completed,
      }),
    }).catch(() => { /* silent */ })
  },

  // Fire-and-forget owner-side sync for kanban column move
  syncOwnerColumnMove: (taskId, columnId, columnTitle) => {
    const assignments = get().getAssignmentsForSource('kanban_task', taskId)
    if (assignments.length === 0) return
    const bordId = assignments[0].bordId
    fetch(`/api/bords/${bordId}/assignments/owner-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: 'kanban_task',
        sourceId: taskId,
        action: 'move_column',
        columnId,
        columnTitle,
      }),
    }).catch(() => { /* silent */ })
  },

  openAssignModal: (context) =>
    set({ isAssignModalOpen: true, assignModalContext: context }),
  closeAssignModal: () =>
    set({ isAssignModalOpen: false, assignModalContext: null }),

  acceptInvitation: async (invitationId) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message)
      // Refresh notifications and orgs
      await get().fetchNotifications()
      return { success: true, message: data.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  },

  declineInvitation: async (notificationId) => {
    // Just mark the notification as read (dismiss it)
    await get().markNotificationsRead([notificationId])
  },
}))
