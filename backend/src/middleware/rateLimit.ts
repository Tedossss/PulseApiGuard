const { rateLimit } = require("express-rate-limit")
const { RedisStore } = require("rate-limit-redis")
const { getRedisClient } = require("../config/redis")

const createRateLimiter = ({ windowMs, max, message, prefix = "global" }) => {
  const client = getRedisClient()

  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store: new RedisStore({
      prefix: `pulseguard:rate-limit:${prefix}:`,
      sendCommand: (...args) => client.sendCommand(args),
    }),
    handler(req, res) {
      return res.status(429).json({ message })
    },
  })
}

module.exports = createRateLimiter
