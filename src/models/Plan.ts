import mongoose, { Schema, Document } from 'mongoose'

export interface IPlan extends Document {
  name: string
  slug: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  maxBoards: number
  maxTasksPerBoard: number
  maxCollaborators: number
  hasAdvancedFeatures: boolean
  isActive: boolean
  stripePriceId?: string
  paystackPlanCode?: string
  createdAt: Date
  updatedAt: Date
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN',
      uppercase: true,
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    maxBoards: {
      type: Number,
      required: true,
      default: 3,
    },
    maxTasksPerBoard: {
      type: Number,
      required: true,
      default: 50,
    },
    maxCollaborators: {
      type: Number,
      required: true,
      default: 0,
    },
    hasAdvancedFeatures: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripePriceId: {
      type: String,
      sparse: true,
    },
    paystackPlanCode: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
PlanSchema.index({ slug: 1 })
PlanSchema.index({ isActive: 1 })

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema)
