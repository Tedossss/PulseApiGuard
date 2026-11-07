import IORedis, { type RedisOptions } from "ioredis"
import type { ConnectionOptions } from "bullmq"

let client: IORedis | undefined

const requireRedisUrl = () => {
  const url = process.env.REDIS_URL
  if (!url) throw new Error("REDIS_URL is required")
  return url
}

/** Shared connection for rate limiting and readiness checks. */
export const getRedisClient = () => {
  if (client) return client

  client = new IORedis(requireRedisUrl(), { lazyConnect: true, maxRetriesPerRequest: 1 })
  client.on("error", (error: Error) => {
    console.error("Redis error:", error.message)
  })

  return client
}

/** Dedicated connection for long-lived blocking work such as locks and leases. */
export const createRedisConnection = (label: string, options: RedisOptions = {}) => {
  const connection = new IORedis(requireRedisUrl(), { maxRetriesPerRequest: null, ...options })
  connection.on("error", (error: Error) => {
    console.error(`${label} Redis error:`, error.message)
  })
  return connection
}

export const connectRedis = async () => {
  const redis = getRedisClient()
  if (redis.status === "wait") await redis.connect()
  await redis.ping()
  console.log("Redis connected")
  return redis
}

export const closeRedis = async () => {
  if (client && client.status !== "end") await client.quit()
  client = undefined
}

export const getBullConnectionOptions = ({ worker = false } = {}): ConnectionOptions => {
  const redisUrl = new URL(requireRedisUrl())
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
