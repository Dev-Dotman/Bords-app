import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IUnpublishedChangeTracker {
  _id: string
  bordId: Types.ObjectId
  changeCount: number
  lastModifiedAt: Date
}

const UnpublishedChangeTrackerSchema = new Schema<IUnpublishedChangeTracker>(
  {
    bordId: {
      type: Schema.Types.ObjectId,
      ref: 'Bord',
      required: true,
      unique: true,
    },
    changeCount: {
      type: Number,
      default: 0,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

const UnpublishedChangeTracker: Model<IUnpublishedChangeTracker> =
  mongoose.models.UnpublishedChangeTracker ||
  mongoose.model<IUnpublishedChangeTracker>(
    'UnpublishedChangeTracker',
    UnpublishedChangeTrackerSchema
  )

export default UnpublishedChangeTracker
