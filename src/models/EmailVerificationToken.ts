import mongoose, { Schema, Model } from 'mongoose'

export interface IEmailVerificationToken {
  _id: string
  userId: mongoose.Types.ObjectId
  tokenHash: string
  expiresAt: Date
  createdAt: Date
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Indexes for performance
EmailVerificationTokenSchema.index({ tokenHash: 1 })
EmailVerificationTokenSchema.index({ userId: 1 })

const EmailVerificationToken: Model<IEmailVerificationToken> =
  mongoose.models.EmailVerificationToken ||
  mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema)

export default EmailVerificationToken
