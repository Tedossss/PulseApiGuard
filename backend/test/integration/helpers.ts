import type { Express } from "express"
import mongoose from "mongoose"
import request from "supertest"
import { createApp } from "../../src/app"
import { closeRedis, connectRedis, getRedisClient } from "../../src/config/redis"
import { closeMonitorQueue, getMonitorQueue } from "../../src/queues/monitorQueue"

/**
 * Integration tests need real MongoDB and Redis instances. CI provides them as
 * service containers; locally run `docker compose up -d mongo redis` and set the
 * variables below. Without them the suites are skipped instead of failing.
 */
export const TEST_MONGO_URI = process.env.TEST_MONGO_URI
export const TEST_REDIS_URL = process.env.TEST_REDIS_URL
export const integrationEnabled = Boolean(TEST_MONGO_URI && TEST_REDIS_URL)
export const skipReason = integrationEnabled
  ? false
  : "set TEST_MONGO_URI and TEST_REDIS_URL to run integration tests"

let app: Express | undefined

export const setupIntegration = async () => {
  process.env.REDIS_URL = TEST_REDIS_URL
  process.env.JWT_SECRET = "integration-secret-that-is-at-least-32-characters"
  process.env.CORS_ORIGINS = "http://localhost:3000"

  await mongoose.connect(TEST_MONGO_URI!)
  await mongoose.connection.dropDatabase()
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()))
  const redis = await connectRedis()
  await redis.flushdb()

  app = createApp()
  return app
}

export const teardownIntegration = async () => {
  await getMonitorQueue().obliterate({ force: true })
  await closeMonitorQueue()
  await getRedisClient().flushdb()
  await closeRedis()
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}

export const resetRateLimits = async () => {
  const redis = getRedisClient()
  const keys = await redis.keys("pulseguard:rate-limit:*")
  if (keys.length) await redis.del(...keys)
}

export const api = () => {
  if (!app) throw new Error("setupIntegration() must run first")
  return request(app)
}

let userCounter = 0

/** Registers and signs in a fresh user, returning the session cookie for later requests. */
export const signUp = async () => {
  await resetRateLimits()
  userCounter += 1
  const credentials = { email: `user${userCounter}@example.com`, password: "correct-horse-battery" }

  await api().post("/api/auth/register").send(credentials).expect(201)
  const login = await api().post("/api/auth/login").send(credentials).expect(200)
  const cookie = login.get("Set-Cookie")?.[0]?.split(";")[0]
  if (!cookie) throw new Error("Login did not set a session cookie")

  return { ...credentials, id: String(login.body._id), cookie }
}

export const monitorBody = (overrides: Record<string, unknown> = {}) => ({
  name: "Example API",
  url: "https://example.com/health",
  method: "GET",
  expectedStatus: 200,
  interval: 60,
  ...overrides,
})
