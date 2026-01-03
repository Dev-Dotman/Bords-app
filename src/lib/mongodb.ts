import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const MONGODB_URI = process.env.MONGODB_URI

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof import('mongoose') | null
    promise: Promise<typeof import('mongoose')> | null
  }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    console.log('📦 Using cached MongoDB connection')
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully')
      return mongooseInstance
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('❌ MongoDB connection error:', e)
    throw e
  }

  return cached.conn
}

export default connectDB
