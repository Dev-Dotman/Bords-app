import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IPublishSnapshot {
  _id: string
  bordId: Types.ObjectId
  versionNumber: number
  publishedBy: Types.ObjectId
  newAssignments: number
  reassignments: number
  unassignments: number
  publishedAt: Date
}

const PublishSnapshotSchema = new Schema<IPublishSnapshot>(
  {
    bordId: {
      type: Schema.Types.ObjectId,
      ref: 'Bord',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    newAssignments: {
      type: Number,
      default: 0,
    },
    reassignments: {
      type: Number,
      default: 0,
    },
    unassignments: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

PublishSnapshotSchema.index({ bordId: 1, versionNumber: -1 })

const PublishSnapshot: Model<IPublishSnapshot> =
  mongoose.models.PublishSnapshot ||
  mongoose.model<IPublishSnapshot>('PublishSnapshot', PublishSnapshotSchema)

export default PublishSnapshot
