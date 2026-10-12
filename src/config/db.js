import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
  console.log(`[db] connected to "${mongoose.connection.name}" on ${mongoose.connection.host}`)
  return mongoose.connection
}

export async function disconnectDB() {
  await mongoose.disconnect()
}
