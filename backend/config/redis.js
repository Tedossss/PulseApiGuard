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

module.exports = {
  getRedisClient,
  connectRedis,
  closeRedis,
}
