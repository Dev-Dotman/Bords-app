import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPayment extends Document {
  userId: Types.ObjectId
  subscriptionId?: Types.ObjectId
  planId: Types.ObjectId
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'abandoned'
  paymentMethod: 'paystack' | 'stripe' | 'manual'
  paystackReference?: string
  paystackAccessCode?: string
  metadata?: Record<string, any>
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
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
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    amount: {
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
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'abandoned'],
      default: 'pending',
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'stripe', 'manual'],
      default: 'paystack',
      required: true,
    },
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    paystackAccessCode: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
PaymentSchema.index({ userId: 1, status: 1 })
PaymentSchema.index({ paystackReference: 1 })
PaymentSchema.index({ createdAt: -1 })

export default mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', PaymentSchema)
