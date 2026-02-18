import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IBord {
  _id: string
  organizationId: Types.ObjectId
  localBoardId: string
  title: string
  ownerId: Types.ObjectId
  lastPublishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const BordSchema = new Schema<IBord>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    localBoardId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastPublishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

BordSchema.index({ organizationId: 1, localBoardId: 1 }, { unique: true })
BordSchema.index({ ownerId: 1 })

const Bord: Model<IBord> =
  mongoose.models.Bord || mongoose.model<IBord>('Bord', BordSchema)

export default Bord
