import type { Request, Response } from "express"
import mongoose from "mongoose"
import { getRedisClient } from "../config/redis"
import { errorMessage } from "../utils/errors"

const disableHealthCheckCaching = (res: Response) => {
  res.set("Cache-Control", "no-store")
}

export const buildReadiness = ({
  mongoReady,
  redisReady,
}: {
  mongoReady: boolean
  redisReady: boolean
}) => ({
  ready: mongoReady && redisReady,
  body: {
    status: mongoReady && redisReady ? "ready" : "not_ready",
    checks: {
      mongodb: mongoReady ? "up" : "down",
      redis: redisReady ? "up" : "down",
    },
  },
})

export const liveCheck = (_req: Request, res: Response) => {
  disableHealthCheckCaching(res)
  return res.json({ status: "ok", uptime: process.uptime() })
}

export const readyCheck = async (_req: Request, res: Response) => {
  disableHealthCheckCaching(res)
  const mongoReady = mongoose.connection.readyState === mongoose.ConnectionStates.connected
  let redisReady = false

  try {
    const redis = getRedisClient()
    redisReady = redis.status === "ready" && (await redis.ping()) === "PONG"
  } catch (error) {
    console.error("Readiness Redis check failed:", errorMessage(error))
  }

  const readiness = buildReadiness({ mongoReady, redisReady })
  return res.status(readiness.ready ? 200 : 503).json(readiness.body)
}

export const healthCheck = readyCheck
