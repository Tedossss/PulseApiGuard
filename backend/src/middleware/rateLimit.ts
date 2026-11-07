import { rateLimit } from "express-rate-limit"
import { RedisStore, type RedisReply } from "rate-limit-redis"
import { getRedisClient } from "../config/redis"
import { sendError } from "../utils/errors"

interface RateLimiterOptions {
  windowMs: number
  max: number
  message: string
  prefix?: string
}

const createRateLimiter = ({ windowMs, max, message, prefix = "global" }: RateLimiterOptions) => {
  const client = getRedisClient()

  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store: new RedisStore({
      prefix: `pulseguard:rate-limit:${prefix}:`,
      sendCommand: (command: string, ...args: string[]) =>
        client.call(command, ...args) as Promise<RedisReply>,
    }),
    handler(_req, res) {
      return sendError(res, 429, message, "RATE_LIMITED")
    },
  })
}

export default createRateLimiter
