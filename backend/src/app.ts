import cors from "cors"
import express, { type NextFunction, type Request, type Response } from "express"
import helmet from "helmet"
import createRateLimiter from "./middleware/rateLimit"
import authRoutes from "./routes/authRoutes"
import dashboardRoutes from "./routes/dashboardRoutes"
import monitorRoutes from "./routes/monitorRoutes"
import systemRoutes from "./routes/systemRoutes"
import telegramRoutes from "./routes/telegramRoutes"
import createTestRoutes from "./routes/testRoutes"
import { sendError } from "./utils/errors"

const CORS_REJECTED = "Origin not allowed by CORS"

export const createApp = () => {
  const app = express()

  const trustProxy = process.env.TRUST_PROXY
  if (trustProxy && trustProxy !== "false") {
    const numericTrustProxy = Number(trustProxy)
    app.set("trust proxy", Number.isInteger(numericTrustProxy) ? numericTrustProxy : trustProxy)
  }

  const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.disable("x-powered-by")
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error(CORS_REJECTED))
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  app.use(express.json({ limit: "32kb" }))

  app.use(
    "/api",
    createRateLimiter({
      windowMs: 60 * 1000,
      max: 120,
      message: "Too many API requests. Try again shortly.",
      prefix: "api",
    }),
  )

  app.use(
    "/api/auth",
    createRateLimiter({
      windowMs: 10 * 60 * 1000,
      max: 10,
      message: "Too many authentication attempts. Try again later.",
      prefix: "auth",
    }),
    authRoutes,
  )
  app.use("/api/monitor", monitorRoutes)
  app.use("/api/test", createTestRoutes())
  app.use("/api/dashboard", dashboardRoutes)
  app.use("/api/system", systemRoutes)
  app.use("/api/telegram", telegramRoutes)

  app.get("/", (_req, res) => {
    res.send("PulseGuard API is running!")
  })

  app.use((_req, res) => sendError(res, 404, "Route not found"))

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Error && err.message === CORS_REJECTED) {
      return sendError(res, 403, "Origin not allowed")
    }
    if ((err as { type?: string })?.type === "entity.parse.failed") {
      return sendError(res, 400, "Request body must be valid JSON")
    }

    console.error("Unhandled request error:", err)
    return sendError(res, 500, "Internal server error")
  })

  return app
}
