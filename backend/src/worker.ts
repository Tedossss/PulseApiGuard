import "dotenv/config"
import mongoose from "mongoose"
import connectDB from "./config/db"
import { closeMonitorQueue } from "./queues/monitorQueue"
import { closeTelegramBot, startTelegramBot } from "./services/telegramBot"
import { closeMonitorWorker, startMonitorWorker } from "./workers/monitorWorker"

const validateEnvironment = () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required")
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required")
}

const start = async () => {
  validateEnvironment()
  const connected = await connectDB({ retry: true, retryDelayMs: 5000 })
  if (!connected) throw new Error("MongoDB connection failed")

  await startMonitorWorker()
  startTelegramBot()

  const shutdown = async (signal: NodeJS.Signals) => {
    console.log(`${signal} received, stopping monitor worker`)
    await closeTelegramBot()
    await closeMonitorWorker()
    await closeMonitorQueue()
    await mongoose.disconnect()
    process.exit(0)
  }

  process.once("SIGTERM", () => void shutdown("SIGTERM"))
  process.once("SIGINT", () => void shutdown("SIGINT"))
}

start().catch((error) => {
  console.error("Fatal worker startup error:", error)
  process.exitCode = 1
})
