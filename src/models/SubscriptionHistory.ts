import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISubscriptionHistory extends Document {
  userId: Types.ObjectId
  subscriptionId: Types.ObjectId
  action: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'canceled' | 'expired' | 'payment_failed'
  fromPlanId?: Types.ObjectId
  toPlanId?: Types.ObjectId
  metadata?: Record<string, any>
  createdAt: Date
}

const SubscriptionHistorySchema = new Schema<ISubscriptionHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'renewed', 'upgraded', 'downgraded', 'canceled', 'expired', 'payment_failed'],
      required: true,
      index: true,
    },
    fromPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    toPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Indexes
SubscriptionHistorySchema.index({ userId: 1, createdAt: -1 })
SubscriptionHistorySchema.index({ subscriptionId: 1, createdAt: -1 })

export default mongoose.models.SubscriptionHistory ||
  mongoose.model<ISubscriptionHistory>('SubscriptionHistory', SubscriptionHistorySchema)
