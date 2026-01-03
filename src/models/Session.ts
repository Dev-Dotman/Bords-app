import mongoose, { Schema, Model } from 'mongoose'

export interface ISession {
  _id: string
  userId: mongoose.Types.ObjectId
  sessionToken: string
  expires: Date
  createdAt: Date
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionToken: {
      type: String,
      unique: true,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Indexes for performance
SessionSchema.index({ sessionToken: 1 })
SessionSchema.index({ userId: 1 })
SessionSchema.index({ expires: 1 }) // For cleanup cron

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)

export default Session
