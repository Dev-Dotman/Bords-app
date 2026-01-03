import mongoose, { Schema, Model } from 'mongoose'

export interface IPasswordResetToken {
  _id: string
  userId: mongoose.Types.ObjectId
  tokenHash: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
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
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Indexes for performance
PasswordResetTokenSchema.index({ tokenHash: 1 })
PasswordResetTokenSchema.index({ userId: 1, usedAt: 1 })

const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema)

export default PasswordResetToken
