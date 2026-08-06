const mongoose = require("mongoose")
const { getRedisClient } = require("../config/redis")

const disableHealthCheckCaching = res => {
  res.set("Cache-Control", "no-store")
}

const buildReadiness = ({ mongoReady, redisReady }) => ({
  ready: mongoReady && redisReady,
  body: {
    status: mongoReady && redisReady ? "ready" : "not_ready",
    checks: {
      mongodb: mongoReady ? "up" : "down",
      redis: redisReady ? "up" : "down",
    },
  },
})

exports.liveCheck = (req, res) => {
  disableHealthCheckCaching(res)
  return res.json({ status: "ok", uptime: process.uptime() })
}

exports.readyCheck = async (req, res) => {
  disableHealthCheckCaching(res)
  const mongoReady = mongoose.connection.readyState === 1
  let redisReady = false

  try {
    const redis = getRedisClient()
    redisReady = Boolean(redis.isOpen && redis.isReady && await redis.ping() === "PONG")
  } catch (error) {
    console.error("Readiness Redis check failed:", error.message)
  }

  const readiness = buildReadiness({ mongoReady, redisReady })
  return res.status(readiness.ready ? 200 : 503).json(readiness.body)
}

exports.healthCheck = exports.readyCheck
exports.buildReadiness = buildReadiness
