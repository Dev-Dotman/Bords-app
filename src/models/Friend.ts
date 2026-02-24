import mongoose, { Schema, Model, Types } from 'mongoose'

/**
 * Friends are personal-workspace contacts who can receive
 * reminders / personal task assignments and collaborate on
 * personal boards (view/edit access via BoardDocument.sharedWith).
 */
export interface IFriend {
  _id: string
  workspaceId: Types.ObjectId  // must be a 'personal' workspace
  ownerId: Types.ObjectId      // workspace owner
  friendUserId: Types.ObjectId // the friend user
  email: string                // denormalized for quick display
  nickname?: string            // optional display name
  status: 'pending' | 'accepted' // pending until the friend accepts
  createdAt: Date
}

const FriendSchema = new Schema<IFriend>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    friendUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    nickname: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

FriendSchema.index({ workspaceId: 1, friendUserId: 1 }, { unique: true })

const Friend: Model<IFriend> =
  mongoose.models.Friend ||
  mongoose.model<IFriend>('Friend', FriendSchema)

export default Friend
