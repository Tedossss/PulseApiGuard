require("dotenv").config()

const connectDB = require("./config/db")
const { connectRedis, closeRedis } = require("./config/redis")
const { closeMonitorQueue } = require("./queues/monitorQueue")

const PORT = process.env.PORT || 3001

const validateEnvironment = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required")
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters")
  }

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required")
  }
}

const start = async () => {
  validateEnvironment()
  const connected = await connectDB({ retry: true, retryDelayMs: 5000 })
  if (!connected) throw new Error("MongoDB connection failed")

  await connectRedis()

  const app = require("./app")
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`)
    server.close(async () => {
      await closeMonitorQueue()
      await closeRedis()
      process.exit(0)
    })
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"))
  process.once("SIGINT", () => shutdown("SIGINT"))
}

start().catch((err) => {
  console.error("Fatal startup error:", err)
  process.exitCode = 1
})
