import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISubscription extends Document {
  userId: Types.ObjectId
  planId: Types.ObjectId
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing'
  startDate: Date
  endDate: Date
  autoRenew: boolean
  paystackSubscriptionCode?: string
  paystackCustomerCode?: string
  canceledAt?: Date
  cancelReason?: string
  trialEndsAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'past_due', 'trialing'],
      default: 'active',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paystackSubscriptionCode: {
      type: String,
      sparse: true,
    },
    paystackCustomerCode: {
      type: String,
      sparse: true,
    },
    canceledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
    trialEndsAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
SubscriptionSchema.index({ userId: 1, status: 1 })
SubscriptionSchema.index({ endDate: 1 }) // For finding expiring subscriptions
SubscriptionSchema.index({ paystackSubscriptionCode: 1 })

// Virtual to check if subscription is valid
SubscriptionSchema.virtual('isValid').get(function () {
  return (
    this.status === 'active' &&
    new Date() < this.endDate
  )
})

export default mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema)
