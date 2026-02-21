import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IOrganization {
  _id: string
  workspaceId?: Types.ObjectId  // the org_container workspace
  name: string
  ownerId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    name: {
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
  },
  {
    timestamps: true,
  }
)

OrganizationSchema.index({ ownerId: 1 })

const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema)

export default Organization
