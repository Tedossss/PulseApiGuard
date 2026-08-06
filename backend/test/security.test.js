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
const {
  calculateMonitorState,
  shouldSendStatusAlert,
} = require("../workers/monitorWorker")
const auth = require("../middleware/auth")
const { buildReadiness } = require("../controllers/systemController")
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
const {
  buildMonitorAlert,
  escapeHtml,
  formatDuration,
  parseStartToken,
  processUpdateBatch,
  redactMonitorUrl,
} = require("../services/telegramBot")
const {
  getTelegramBotUsername,
  hashTelegramLinkToken,
} = require("../utils/telegram")
const telegramController = require("../controllers/telegramController")
const User = require("../models/User")

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  ended: false,
  status(code) {
    this.statusCode = code
    return this
  },
  json(body) {
    this.body = body
    return this
  },
  end() {
    this.ended = true
    return this
  },
})

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
  assert.equal(shouldSendStatusAlert("PENDING", "UP"), false)
  assert.equal(shouldSendStatusAlert("UP", "DOWN"), true)
  assert.equal(shouldSendStatusAlert("DOWN", "UP"), true)
})

test("Telegram link tokens are hashed and start commands are parsed strictly", () => {
  assert.equal(hashTelegramLinkToken("one-time-token").length, 64)
  assert.equal(hashTelegramLinkToken("one-time-token"), hashTelegramLinkToken("one-time-token"))
  assert.equal(parseStartToken("/start one-time_token-1"), "one-time_token-1")
  assert.equal(parseStartToken("/start@PulseApiGuard_bot token"), "token")
  assert.equal(parseStartToken("/start"), "")
  assert.equal(parseStartToken("hello"), null)
  assert.equal(parseStartToken("/start token with spaces"), null)
})

test("Telegram polling only advances past successfully processed updates", async () => {
  const handled = []
  const result = await processUpdateBatch([
    { update_id: 10 },
    { update_id: 11 },
    { update_id: 12 },
  ], {
    offset: 10,
    handler: async (update) => {
      handled.push(update.update_id)
      if (update.update_id === 11) throw new Error("temporary database failure")
    },
  })

  assert.deepEqual(handled, [10, 11])
  assert.equal(result.offset, 11)
  assert.match(result.error.message, /temporary database failure/)
})

test("Telegram controllers expose status and store only a hashed link token", async (t) => {
  const originalFindById = User.findById
  const originalFindByIdAndUpdate = User.findByIdAndUpdate
  const originalBotToken = process.env.TELEGRAM_BOT_TOKEN
  const originalBotUsername = process.env.TELEGRAM_BOT_USERNAME
  t.after(() => {
    User.findById = originalFindById
    User.findByIdAndUpdate = originalFindByIdAndUpdate
    if (originalBotToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN
    else process.env.TELEGRAM_BOT_TOKEN = originalBotToken
    if (originalBotUsername === undefined) delete process.env.TELEGRAM_BOT_USERNAME
    else process.env.TELEGRAM_BOT_USERNAME = originalBotUsername
  })

  process.env.TELEGRAM_BOT_TOKEN = "test-token"
  process.env.TELEGRAM_BOT_USERNAME = "PulseApiGuard_bot"
  User.findById = () => ({
    select: () => ({
      lean: async () => ({
        telegramChatId: "123",
        telegramUsername: "pulse_owner",
        telegramLinkedAt: new Date("2026-08-07T12:00:00.000Z"),
      }),
    }),
  })

  const statusResponse = createResponse()
  await telegramController.getStatus({ user: "user-1" }, statusResponse)
  assert.equal(statusResponse.body.configured, true)
  assert.equal(statusResponse.body.connected, true)
  assert.equal(statusResponse.body.username, "pulse_owner")

  let storedUpdate
  User.findByIdAndUpdate = async (userId, update) => {
    assert.equal(userId, "user-1")
    storedUpdate = update
    return { _id: userId }
  }
  const linkResponse = createResponse()
  await telegramController.createLink({ user: "user-1" }, linkResponse)

  const link = new URL(linkResponse.body.link)
  const rawToken = link.searchParams.get("start")
  assert.equal(link.hostname, "t.me")
  assert.equal(link.pathname, "/PulseApiGuard_bot")
  assert.ok(rawToken)
  assert.equal(storedUpdate.$set.telegramLinkTokenHash, hashTelegramLinkToken(rawToken))
  assert.notEqual(storedUpdate.$set.telegramLinkTokenHash, rawToken)
  assert.ok(storedUpdate.$set.telegramLinkTokenExpiresAt instanceof Date)
})

test("Telegram bot usernames are normalized and validated", () => {
  const originalValue = process.env.TELEGRAM_BOT_USERNAME

  process.env.TELEGRAM_BOT_USERNAME = "@PulseApiGuard_bot"
  assert.equal(getTelegramBotUsername(), "PulseApiGuard_bot")
  process.env.TELEGRAM_BOT_USERNAME = "invalid/name"
  assert.equal(getTelegramBotUsername(), "")

  if (originalValue === undefined) delete process.env.TELEGRAM_BOT_USERNAME
  else process.env.TELEGRAM_BOT_USERNAME = originalValue
})

test("Telegram alerts escape endpoint data and preserve recovery downtime", () => {
  assert.equal(escapeHtml("<API & status>"), "&lt;API &amp; status&gt;")
  assert.equal(formatDuration(3_661_000), "1h 1m")
  assert.equal(
    redactMonitorUrl("https://example.com/health?api_key=secret#debug"),
    "https://example.com/health",
  )

  const alert = buildMonitorAlert({
    monitor: {
      name: "<Billing & API>",
      url: "https://example.com/health?a=1&b=2",
      expectedStatus: 200,
      downSince: null,
    },
    nextStatus: "UP",
    result: { statusCode: 200 },
    changedAt: new Date("2026-08-07T12:05:00.000Z"),
    downSince: new Date("2026-08-07T12:00:00.000Z"),
  })

  assert.match(alert, /Endpoint recovered/)
  assert.match(alert, /&lt;Billing &amp; API&gt;/)
  assert.doesNotMatch(alert, /a=1|b=2/)
  assert.match(alert, /Downtime: <b>5m 0s<\/b>/)
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
