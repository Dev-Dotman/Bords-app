import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IOrganization {
  _id: string
  name: string
  ownerId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
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
