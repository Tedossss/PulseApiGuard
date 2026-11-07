require("dotenv").config()

const mongoose = require("mongoose")
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

  if (
    process.env.SESSION_COOKIE_SECURE !== undefined &&
    !["true", "false"].includes(process.env.SESSION_COOKIE_SECURE)
  ) {
    throw new Error("SESSION_COOKIE_SECURE must be true or false")
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

  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`${signal} received, shutting down`)

    const forceShutdown = setTimeout(() => {
      console.error("Graceful shutdown timed out")
      process.exit(1)
    }, 10000)
    forceShutdown.unref()

    server.closeIdleConnections?.()
    await new Promise(resolve => server.close(resolve))

    const cleanup = await Promise.allSettled([
      closeMonitorQueue(),
      closeRedis(),
      mongoose.disconnect(),
    ])
    const failed = cleanup.filter(result => result.status === "rejected")
    for (const result of failed) console.error("Shutdown cleanup failed:", result.reason)

    clearTimeout(forceShutdown)
    process.exit(failed.length > 0 ? 1 : 0)
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"))
  process.once("SIGINT", () => shutdown("SIGINT"))
}

start().catch((err) => {
  console.error("Fatal startup error:", err)
  process.exitCode = 1
})
