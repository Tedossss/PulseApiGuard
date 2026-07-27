const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const createRateLimiter = require("./middleware/rateLimit")
const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)

app.disable("x-powered-by")
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error("Origin not allowed by CORS"))
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))
app.use(express.json({ limit: "32kb" }))

app.use("/api", createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many API requests. Try again shortly.",
}))

// Routes
app.use("/api/auth", createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Try again later.",
}), require("./routes/authRoutes"))
app.use("/api/monitor", require("./routes/monitorRoutes"))
app.use("/api/test", require("./routes/testRoutes"))
app.use("/api/dashboard", require("./routes/dashboardRoutes"))
app.use("/api/system", require("./routes/systemRoutes"))


// Health check
app.get("/", (req, res) => {
  res.send("PulseGuard API is running!")
})

app.use((err, req, res, next) => {
  if (err?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" })
  }

  console.error("Unhandled request error:", err)
  return res.status(500).json({ message: "Internal server error" })
})

module.exports = app
