const { createClient } = require("redis")

let client

const getRedisClient = () => {
  if (client) return client

  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error("REDIS_URL is required")
  }

  client = createClient({ url })
  client.on("error", (error) => {
    console.error("Redis error:", error.message)
  })

  return client
}

const connectRedis = async () => {
  const redis = getRedisClient()
  if (!redis.isOpen) await redis.connect()
  await redis.ping()
  console.log("Redis connected")
  return redis
}

const closeRedis = async () => {
  if (client?.isOpen) await client.quit()
}

const getBullConnectionOptions = ({ worker = false } = {}) => {
  const redisUrl = new URL(process.env.REDIS_URL)
  if (!["redis:", "rediss:"].includes(redisUrl.protocol)) {
    throw new Error("REDIS_URL must use redis:// or rediss://")
  }

  const database = redisUrl.pathname.replace(/^\//, "")
  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
    password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
    db: database ? Number(database) : 0,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: worker ? null : 1,
  }
}

module.exports = {
  getRedisClient,
  getBullConnectionOptions,
  connectRedis,
  closeRedis,
}
