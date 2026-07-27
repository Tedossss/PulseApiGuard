require("dotenv").config()

const app = require("./app")
const connectDB = require("./config/db")

const { startWorker } = require("./workers/monitorWorker")

const PORT = process.env.PORT || 3001

const validateEnvironment = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required")
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters")
  }
}

const start = async () => {
  validateEnvironment()
  // Start HTTP server first (so health endpoint can respond even if DB is down)
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  // DB connect with retries (does not crash the process)
  const connected = await connectDB({ retry: true, retryDelayMs: 5000 })

  // Start monitoring worker only when DB is available (it needs Mongo models)
  if (connected) {
    startWorker()
  } else {
    console.log("Monitoring worker not started (DB not connected yet).")
  }
}

start().catch((err) => {
  console.error("Fatal startup error:", err)
})
