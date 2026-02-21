import mongoose, { Schema, Model, Types } from 'mongoose'

export interface INotification {
  _id: string
  userId: Types.ObjectId
  type:
    | 'task_assigned'
    | 'task_unassigned'
    | 'task_reassigned'
    | 'task_completed'
    | 'task_updated'
    | 'org_invitation'
    | 'invitation_accepted'
    | 'friend_request'
    | 'friend_accepted'
    | 'friend_removed'
    | 'reminder_due'
    | 'reminder_overdue'
  title: string
  message: string
  metadata: {
    bordId?: string
    taskAssignmentId?: string
    bordTitle?: string
    organizationId?: string
    organizationName?: string
    invitationId?: string
    friendId?: string
    senderName?: string
    sourceType?: string
    sourceId?: string
  }
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_unassigned',
        'task_reassigned',
        'task_completed',
        'task_updated',
        'org_invitation',
        'invitation_accepted',
        'friend_request',
        'friend_accepted',
        'friend_removed',
        'reminder_due',
        'reminder_overdue',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      bordId: String,
      taskAssignmentId: String,
      bordTitle: String,
      organizationId: String,
      organizationName: String,
      invitationId: String,
      friendId: String,
      senderName: String,
      sourceType: String,
      sourceId: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification
