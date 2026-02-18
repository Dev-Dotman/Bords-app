import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IEmployeeMembership {
  _id: string
  organizationId: Types.ObjectId
  userId: Types.ObjectId
  createdAt: Date
}

const EmployeeMembershipSchema = new Schema<IEmployeeMembership>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

EmployeeMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true })

const EmployeeMembership: Model<IEmployeeMembership> =
  mongoose.models.EmployeeMembership ||
  mongoose.model<IEmployeeMembership>('EmployeeMembership', EmployeeMembershipSchema)

export default EmployeeMembership
