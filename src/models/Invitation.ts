import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IInvitation {
  _id: string
  organizationId: Types.ObjectId
  email: string
  role: 'employee' | 'collaborator'
  bordId: Types.ObjectId | null
  collaboratorRole: 'viewer' | 'editor' | null
  invitedBy: Types.ObjectId
  status: 'pending' | 'accepted' | 'expired'
  token: string
  expiresAt: Date
  createdAt: Date
}

const InvitationSchema = new Schema<IInvitation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['employee', 'collaborator'],
      required: true,
    },
    bordId: {
      type: Schema.Types.ObjectId,
      ref: 'Bord',
      default: null,
    },
    collaboratorRole: {
      type: String,
      enum: ['viewer', 'editor', null],
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

InvitationSchema.index({ email: 1, organizationId: 1, status: 1 })
InvitationSchema.index({ token: 1 })
InvitationSchema.index({ expiresAt: 1 })

const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ||
  mongoose.model<IInvitation>('Invitation', InvitationSchema)

export default Invitation
