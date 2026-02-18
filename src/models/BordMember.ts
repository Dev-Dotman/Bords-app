import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IBordMember {
  _id: string
  bordId: Types.ObjectId
  userId: Types.ObjectId
  role: 'viewer' | 'editor'
  canPublish: boolean
  canManageEmployees: boolean
  createdAt: Date
}

const BordMemberSchema = new Schema<IBordMember>(
  {
    bordId: {
      type: Schema.Types.ObjectId,
      ref: 'Bord',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer',
      required: true,
    },
    canPublish: {
      type: Boolean,
      default: false,
    },
    canManageEmployees: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

BordMemberSchema.index({ bordId: 1, userId: 1 }, { unique: true })

const BordMember: Model<IBordMember> =
  mongoose.models.BordMember ||
  mongoose.model<IBordMember>('BordMember', BordMemberSchema)

export default BordMember
