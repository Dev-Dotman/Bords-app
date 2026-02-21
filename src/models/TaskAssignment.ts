import mongoose, { Schema, Model, Types } from 'mongoose'

export interface ITaskAssignment {
  _id: string
  bordId: Types.ObjectId | null  // null for personal tasks without a Bord link
  workspaceId?: Types.ObjectId
  organizationId?: Types.ObjectId // non-null only for org tasks
  contextType: 'personal' | 'organization'
  sourceType: 'note' | 'checklist_item' | 'kanban_task' | 'reminder_item'
  sourceId: string
  content: string
  assignedTo: Types.ObjectId
  assignedBy: Types.ObjectId
  priority: 'low' | 'normal' | 'high'
  dueDate: Date | null
  executionNote: string | null
  status: 'draft' | 'assigned' | 'completed'
  publishedAt: Date | null
  completedAt: Date | null
  isDeleted: boolean
  // Kanban column context
  columnId: string | null
  columnTitle: string | null
  availableColumns: { id: string; title: string }[]
  // Employee updates (synced back to owner)
  employeeUpdates: {
    content: string | null
    columnId: string | null
    columnTitle: string | null
    updatedAt: Date | null
  }
  createdAt: Date
  updatedAt: Date
}

const TaskAssignmentSchema = new Schema<ITaskAssignment>(
  {
    bordId: {
      type: Schema.Types.ObjectId,
      ref: 'Bord',
      default: null,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    contextType: {
      type: String,
      enum: ['personal', 'organization'],
      default: 'organization',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['note', 'checklist_item', 'kanban_task', 'reminder_item'],
      required: true,
    },
    sourceId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    executionNote: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'assigned', 'completed'],
      default: 'draft',
      required: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Kanban column context
    columnId: {
      type: String,
      default: null,
    },
    columnTitle: {
      type: String,
      default: null,
    },
    availableColumns: [
      {
        id: String,
        title: String,
        _id: false,
      },
    ],
    // Employee updates synced back to owner
    employeeUpdates: {
      content: { type: String, default: null },
      columnId: { type: String, default: null },
      columnTitle: { type: String, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
)

TaskAssignmentSchema.index({ bordId: 1, status: 1 })
TaskAssignmentSchema.index({ assignedTo: 1, status: 1 })
TaskAssignmentSchema.index({ bordId: 1, sourceType: 1, sourceId: 1 })
TaskAssignmentSchema.index({ contextType: 1, assignedTo: 1, status: 1 })
TaskAssignmentSchema.index({ workspaceId: 1, contextType: 1 })

const TaskAssignment: Model<ITaskAssignment> =
  mongoose.models.TaskAssignment ||
  mongoose.model<ITaskAssignment>('TaskAssignment', TaskAssignmentSchema)

export default TaskAssignment
