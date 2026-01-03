import mongoose, { Schema, Model } from 'mongoose'

export interface IUser {
  _id: string
  email: string
  passwordHash: string
  emailVerifiedAt: Date | null
  firstName: string
  lastName: string
  image: string
  mfaEnabled: boolean
  loginAttempts: number
  lockUntil: Date | null
  lastLoginAt: Date | null
  lastLoginIp: string | null
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
UserSchema.index({ email: 1 })
UserSchema.index({ emailVerifiedAt: 1 })

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date())
})

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim()
})

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
