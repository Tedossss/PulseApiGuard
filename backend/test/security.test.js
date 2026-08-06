const test = require("node:test")
const assert = require("node:assert/strict")
const jwt = require("jsonwebtoken")

const {
  isPrivateAddress,
  normalizeMethod,
  normalizeTargetUrl,
  selectSafeLookupAddress,
} = require("../services/apiTester")
const {
  getMaxMonitorsPerUser,
  normalizeInterval,
  normalizeMonitorFields,
} = require("../controllers/monitorController")
const { calculateMonitorState } = require("../workers/monitorWorker")
const auth = require("../middleware/auth")
const { buildReadiness, liveCheck, readyCheck } = require("../controllers/systemController")
const {
  SESSION_COOKIE_NAME,
  getBearerToken,
  getSessionToken,
  parseCookies,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
} = require("../utils/session")
const {
  decodeCursor,
  encodeCursor,
  normalizeLogLimit,
  normalizeTrendHours,
} = require("../controllers/dashboardController")

test("private, mapped, translated and reserved IP ranges are rejected", () => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "198.51.100.10",
    "::1",
    "fd00::1",
    "::ffff:7f00:1",
    "::ffff:a00:1",
    "64:ff9b::7f00:1",
    "2001:db8::1",
  ]) {
    assert.equal(isPrivateAddress(address), true, address)
  }

  assert.equal(isPrivateAddress("8.8.8.8"), false)
  assert.equal(isPrivateAddress("2606:4700:4700::1111"), false)
  assert.throws(() => normalizeTargetUrl("http://localhost:3000"), /Private or local/)
  assert.throws(() => normalizeTargetUrl("http://127.0.0.1"), /Private or local/)
  assert.throws(() => normalizeTargetUrl("http://[::1]"), /Private or local/)
  assert.throws(() => normalizeTargetUrl("http://[::ffff:7f00:1]"), /Private or local/)
  assert.throws(() => normalizeTargetUrl("http://[64:ff9b::7f00:1]"), /Private or local/)
})

test("DNS results reject empty, private and mixed address sets", () => {
  assert.throws(() => selectSafeLookupAddress([]), /did not resolve/)
  assert.throws(
    () => selectSafeLookupAddress([{ address: "127.0.0.1", family: 4 }]),
    /private or unsupported/,
  )
  assert.throws(
    () => selectSafeLookupAddress([
      { address: "8.8.8.8", family: 4 },
      { address: "::ffff:7f00:1", family: 6 },
    ]),
    /private or unsupported/,
  )
  assert.deepEqual(
    selectSafeLookupAddress([
      { address: "8.8.8.8", family: 4 },
      { address: "2606:4700:4700::1111", family: 6 },
    ], { family: 6 }),
    { address: "2606:4700:4700::1111", family: 6 },
  )
})

test("monitor targets allow public HTTP URLs without credentials", () => {
  assert.equal(normalizeTargetUrl("https://example.com/health"), "https://example.com/health")
  assert.throws(() => normalizeTargetUrl("file:///etc/passwd"), /Only HTTP and HTTPS/)
  assert.throws(() => normalizeTargetUrl("https://user:pass@example.com"), /Credentials/)
})

test("monitor methods and intervals are constrained", () => {
  assert.equal(normalizeMethod("head"), "HEAD")
  assert.throws(() => normalizeMethod("POST"), /Only GET and HEAD/)
  assert.equal(normalizeInterval(undefined), 60)
  assert.equal(normalizeInterval("30"), 30)
  assert.throws(() => normalizeInterval(-1), /30 to 86400/)
  assert.throws(() => normalizeInterval(999999), /30 to 86400/)
  assert.throws(() => normalizeInterval(30.5), /integer/)
})

test("monitor input is normalized and unknown fields are dropped", () => {
  assert.deepEqual(
    normalizeMonitorFields({
      name: "  Main API  ",
      url: "https://example.com/health",
      method: "get",
      expectedStatus: "204",
      interval: "30",
      user: "not-accepted",
    }),
    {
      url: "https://example.com/health",
      method: "GET",
      expectedStatus: 204,
      interval: 30,
      name: "Main API",
    },
  )

  assert.throws(() => normalizeMonitorFields([]), /JSON object/)
  assert.throws(() => normalizeMonitorFields(null), /JSON object/)
})

test("monitor quotas use a safe default and accept a positive override", () => {
  const originalValue = process.env.MAX_MONITORS_PER_USER

  delete process.env.MAX_MONITORS_PER_USER
  assert.equal(getMaxMonitorsPerUser(), 20)

  process.env.MAX_MONITORS_PER_USER = "50"
  assert.equal(getMaxMonitorsPerUser(), 50)

  process.env.MAX_MONITORS_PER_USER = "invalid"
  assert.equal(getMaxMonitorsPerUser(), 20)

  if (originalValue === undefined) delete process.env.MAX_MONITORS_PER_USER
  else process.env.MAX_MONITORS_PER_USER = originalValue
})

test("monitor state changes after three failures and recovers on success", () => {
  assert.deepEqual(
    calculateMonitorState({ status: "UP", failureCount: 1 }, false),
    { nextFailureCount: 2, nextStatus: "UP" },
  )
  assert.deepEqual(
    calculateMonitorState({ status: "UP", failureCount: 2 }, false),
    { nextFailureCount: 3, nextStatus: "DOWN" },
  )
  assert.deepEqual(
    calculateMonitorState({ status: "DOWN", failureCount: 5 }, true),
    { nextFailureCount: 0, nextStatus: "UP" },
  )
})

test("dashboard query limits are bounded", () => {
  assert.equal(normalizeLogLimit(undefined), 50)
  assert.equal(normalizeLogLimit("0"), 1)
  assert.equal(normalizeLogLimit("500"), 100)
  assert.equal(normalizeTrendHours(undefined), 24)
  assert.equal(normalizeTrendHours("999"), 168)
})

test("log cursors round-trip and reject malformed input", () => {
  const log = {
    _id: new (require("mongoose").Types.ObjectId)(),
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
  }
  const cursor = encodeCursor(log)
  const decoded = decodeCursor(cursor)

  assert.equal(decoded.id.toString(), log._id.toString())
  assert.equal(decoded.createdAt.toISOString(), log.createdAt.toISOString())
  assert.throws(() => decodeCursor("not-a-cursor"), /Invalid cursor/)
})

test("browser sessions use hardened HttpOnly cookies", () => {
  const cookie = serializeSessionCookie("signed.token", {
    maxAgeSeconds: 3600,
    secure: true,
  })

  assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=signed.token`))
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Strict/)
  assert.match(cookie, /Max-Age=3600/)
  assert.match(cookie, /Secure/)
  assert.deepEqual(parseCookies("theme=dark; pulseguard_session=abc%2E123"), {
    theme: "dark",
    pulseguard_session: "abc.123",
  })
  assert.match(serializeExpiredSessionCookie(), /Max-Age=0/)
})

test("authentication accepts cookie sessions and keeps Bearer compatibility", () => {
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters"

  const token = jwt.sign({ id: "user-123" }, process.env.JWT_SECRET, {
    issuer: "pulseguard-api",
    audience: "pulseguard-web",
  })
  const request = { headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } }
  let nextCalled = false
  auth(request, {}, () => { nextCalled = true })

  assert.equal(nextCalled, true)
  assert.equal(request.user, "user-123")
  assert.equal(getSessionToken(request), token)
  assert.equal(getBearerToken(`Bearer ${token}`), token)
  assert.equal(getBearerToken(`Basic ${token}`), null)

  if (originalSecret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = originalSecret
})

test("readiness requires both MongoDB and Redis", () => {
  assert.equal(buildReadiness({ mongoReady: true, redisReady: true }).ready, true)
  assert.deepEqual(
    buildReadiness({ mongoReady: true, redisReady: false }).body,
    {
      status: "not_ready",
      checks: { mongodb: "up", redis: "down" },
    },
  )
})

test("health checks disable response caching", async () => {
  const createResponse = () => {
    const result = { headers: {}, statusCode: 200, body: undefined }
    result.response = {
      set(name, value) {
        result.headers[name] = value
        return this
      },
      status(value) {
        result.statusCode = value
        return this
      },
      json(value) {
        result.body = value
        return this
      },
    }
    return result
  }

  const live = createResponse()
  liveCheck({}, live.response)

  assert.equal(live.headers["Cache-Control"], "no-store")
  assert.equal(live.body.status, "ok")
  assert.equal(typeof live.body.uptime, "number")

  const ready = createResponse()
  const originalRedisUrl = process.env.REDIS_URL
  const originalConsoleError = console.error
  delete process.env.REDIS_URL
  console.error = () => {}

  try {
    await readyCheck({}, ready.response)
  } finally {
    console.error = originalConsoleError
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL
    else process.env.REDIS_URL = originalRedisUrl
  }

  assert.equal(ready.headers["Cache-Control"], "no-store")
  assert.equal(ready.statusCode, 503)
  assert.equal(ready.body.status, "not_ready")
})
