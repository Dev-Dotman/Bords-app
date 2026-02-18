// Delegation system types — shared between client and API

export type UserRole = 'owner' | 'collaborator' | 'employee'
export type CollaboratorRole = 'viewer' | 'editor'
export type AssignmentStatus = 'draft' | 'assigned' | 'completed'
export type TaskPriority = 'low' | 'normal' | 'high'
export type SourceType = 'note' | 'checklist_item' | 'kanban_task'
export type InvitationRole = 'employee' | 'collaborator'

export interface OrganizationDTO {
  _id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface BordDTO {
  _id: string
  organizationId: string
  localBoardId: string
  title: string
  ownerId: string
  lastPublishedAt: string | null
  createdAt: string
}

export interface EmployeeDTO {
  _id: string
  organizationId: string
  userId: string
  user?: {
    _id: string
    email: string
    firstName: string
    lastName: string
    image: string
  }
  createdAt: string
}

export interface TaskAssignmentDTO {
  _id: string
  bordId: string
  sourceType: SourceType
  sourceId: string
  content: string
  assignedTo: string
  assignedBy: string
  priority: TaskPriority
  dueDate: string | null
  executionNote: string | null
  status: AssignmentStatus
  publishedAt: string | null
  completedAt: string | null
  isDeleted: boolean
  // Kanban column context
  columnId: string | null
  columnTitle: string | null
  availableColumns: { id: string; title: string }[]
  // Employee updates synced back to owner
  employeeUpdates?: {
    content: string | null
    columnId: string | null
    columnTitle: string | null
    updatedAt: string | null
  }
  createdAt: string
  assignee?: {
    _id: string
    email: string
    firstName: string
    lastName: string
    image: string
  }
  assigner?: {
    _id: string
    firstName: string
    lastName: string
  }
  bord?: {
    title: string
    organizationId: string
  }
}

export interface NotificationDTO {
  _id: string
  userId: string
  type: 'task_assigned' | 'task_unassigned' | 'task_reassigned' | 'task_completed' | 'task_updated' | 'org_invitation' | 'invitation_accepted'
  title: string
  message: string
  metadata: {
    bordId?: string
    taskAssignmentId?: string
    bordTitle?: string
    organizationId?: string
    organizationName?: string
    invitationId?: string
    sourceType?: SourceType
    sourceId?: string
  }
  isRead: boolean
  createdAt: string
}

export interface InvitationDTO {
  _id: string
  organizationId: string
  email: string
  role: InvitationRole
  status: 'pending' | 'accepted' | 'expired'
  createdAt: string
}

export interface PublishResult {
  snapshotId: string
  versionNumber: number
  newAssignments: number
  reassignments: number
  unassignments: number
}

export interface UnpublishedChanges {
  changeCount: number
  lastModifiedAt: string | null
}
