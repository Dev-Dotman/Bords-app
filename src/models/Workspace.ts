import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IWorkspace {
  _id: string
  ownerId: Types.ObjectId
  type: 'personal' | 'organization_container'
  name: string
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['personal', 'organization_container'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Each user has exactly 1 personal + 1 org container workspace
WorkspaceSchema.index({ ownerId: 1, type: 1 }, { unique: true })

const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace ||
  mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)

export default Workspace
