require("dotenv").config()

const mongoose = require("mongoose")
const connectDB = require("./config/db")
const { closeMonitorQueue } = require("./queues/monitorQueue")
const { closeMonitorWorker, startMonitorWorker } = require("./workers/monitorWorker")

const validateEnvironment = () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required")
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required")
}

const start = async () => {
  validateEnvironment()
  const connected = await connectDB({ retry: true, retryDelayMs: 5000 })
  if (!connected) throw new Error("MongoDB connection failed")

  await startMonitorWorker()

  const shutdown = async (signal) => {
    console.log(`${signal} received, stopping monitor worker`)
    await closeMonitorWorker()
    await closeMonitorQueue()
    await mongoose.disconnect()
    process.exit(0)
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"))
  process.once("SIGINT", () => shutdown("SIGINT"))
}

start().catch((error) => {
  console.error("Fatal worker startup error:", error)
  process.exitCode = 1
})
