import "dotenv/config"
import mongoose from "mongoose"
import { errorMessage } from "../utils/errors"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface ConnectOptions {
  retry?: boolean
  retryDelayMs?: number
}

const connectDB = async ({ retry = true, retryDelayMs = 5000 }: ConnectOptions = {}) => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    console.error("MONGO_URI is not defined. Server will start without DB.")
    return false
  }

  // Avoid reconnect loops if already connected or connecting.
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) return true
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connecting) return false

  while (true) {
    try {
      await mongoose.connect(uri)
      console.log("MongoDB connected")
      return true
    } catch (err) {
      console.error("MongoDB connection failed:", errorMessage(err))
      if (!retry) return false
      await sleep(retryDelayMs)
    }
  }
}

export default connectDB
