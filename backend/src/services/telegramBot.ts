const { randomUUID } = require("node:crypto")
const axios = require("axios")
const IORedis = require("ioredis")
const User = require("../models/User")
const {
  getTelegramBotToken,
  hashTelegramLinkToken,
} = require("../utils/telegram")

const POLL_TIMEOUT_SECONDS = 25
const POLLING_LEASE_KEY = "pulseguard:telegram-polling-leader"
const POLLING_LEASE_TTL_MS = 60 * 1000
const POLLING_RETRY_MS = 10 * 1000
let pollAbortController
let pollingPromise
let pollingRedis

const callTelegram = async (method, payload, options = {}) => {
  const token = getTelegramBotToken()
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured")

  let response
  try {
    response = await axios.post(
      `https://api.telegram.org/bot${token}/${method}`,
      payload,
      { timeout: options.timeout || 10000, signal: options.signal },
    )
  } catch (error) {
    const description = error.response?.data?.description
    throw new Error(`Telegram ${method}: ${description || error.message}`)
  }

  if (!response.data?.ok) throw new Error(`Telegram ${method} request failed`)
  return response.data.result
}

const delay = (milliseconds, signal) => new Promise((resolve) => {
  const timeout = setTimeout(resolve, milliseconds)
  signal?.addEventListener("abort", () => {
    clearTimeout(timeout)
    resolve()
  }, { once: true })
})

const getPollingRedis = () => {
  if (!pollingRedis) {
    pollingRedis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    pollingRedis.on("error", error => console.error("Telegram polling Redis error:", error.message))
  }
  return pollingRedis
}

const acquirePollingLease = (leaseToken) => getPollingRedis().set(
  POLLING_LEASE_KEY,
  leaseToken,
  "PX",
  POLLING_LEASE_TTL_MS,
  "NX",
)

const renewPollingLease = async (leaseToken) => {
  const renewed = await getPollingRedis().eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end",
    1,
    POLLING_LEASE_KEY,
    leaseToken,
    POLLING_LEASE_TTL_MS,
  )
  return renewed === 1
}

const releasePollingLease = (leaseToken) => getPollingRedis().eval(
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
  1,
  POLLING_LEASE_KEY,
  leaseToken,
)

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")

const redactMonitorUrl = (value) => {
  try {
    const url = new URL(String(value))
    url.username = ""
    url.password = ""
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return "Invalid endpoint URL"
  }
}

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

const buildMonitorAlert = ({ monitor, nextStatus, result, changedAt = new Date(), downSince = monitor.downSince }) => {
  const isDown = nextStatus === "DOWN"
  const title = isDown ? "🔴 <b>Endpoint is DOWN</b>" : "🟢 <b>Endpoint recovered</b>"
  const lines = [
    title,
    "",
    `<b>${escapeHtml(monitor.name)}</b>`,
    `<code>${escapeHtml(redactMonitorUrl(monitor.url))}</code>`,
    `Status: <b>${escapeHtml(result.statusCode ?? "No response")}</b> (expected ${escapeHtml(monitor.expectedStatus)})`,
  ]

  if (!isDown && downSince) {
    lines.push(`Downtime: <b>${formatDuration(changedAt.getTime() - new Date(downSince).getTime())}</b>`)
  }

  return lines.join("\n")
}

const sendMessage = (chatId, text) => callTelegram("sendMessage", {
  chat_id: chatId,
  text,
  parse_mode: "HTML",
  link_preview_options: { is_disabled: true },
})

const parseStartToken = (text) => {
  if (typeof text !== "string") return null
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?$/)
  return match ? match[1] || "" : null
}

const linkTelegramChat = async (message, token) => {
  if (message.chat?.type !== "private") return

  if (!token) {
    await sendMessage(message.chat.id, "Open the connection link from PulseGuard Settings to enable alerts.")
    return
  }

  let user
  const telegramUsername = message.from?.username
  const update = {
    $set: {
      telegramChatId: String(message.chat.id),
      telegramLinkedAt: new Date(),
      ...(telegramUsername ? { telegramUsername } : {}),
    },
    $unset: {
      telegramLinkTokenHash: 1,
      telegramLinkTokenExpiresAt: 1,
      ...(!telegramUsername ? { telegramUsername: 1 } : {}),
    },
  }
  try {
    user = await User.findOneAndUpdate({
      telegramLinkTokenHash: hashTelegramLinkToken(token),
      telegramLinkTokenExpiresAt: { $gt: new Date() },
    }, update, { new: true, runValidators: true })
  } catch (error) {
    if (error?.code === 11000) {
      await sendMessage(message.chat.id, "This Telegram chat is already connected to another PulseGuard account.")
      return
    }
    throw error
  }

  if (!user) {
    const alreadyConnected = await User.exists({ telegramChatId: String(message.chat.id) })
    if (alreadyConnected) {
      await sendMessage(message.chat.id, "✅ Telegram alerts are connected. PulseGuard will notify you when an endpoint goes down or recovers.")
      return
    }
    await sendMessage(message.chat.id, "This connection link is invalid or expired. Generate a new one in PulseGuard Settings.")
    return
  }

  await sendMessage(message.chat.id, "✅ Telegram alerts are connected. PulseGuard will notify you when an endpoint goes down or recovers.")
}

const handleUpdate = async (update) => {
  const message = update.message
  if (!message || typeof message.text !== "string") return

  const token = parseStartToken(message.text)
  if (token !== null) await linkTelegramChat(message, token)
}

const processUpdateBatch = async (updates, {
  offset,
  handler = handleUpdate,
  afterEach = async () => true,
} = {}) => {
  let nextOffset = offset
  for (const update of updates) {
    try {
      await handler(update)
    } catch (error) {
      return { offset: nextOffset, error }
    }

    nextOffset = update.update_id + 1
    if (!await afterEach()) return { offset: nextOffset, leaseLost: true }
  }
  return { offset: nextOffset }
}

const pollUpdates = async (signal, leaseToken) => {
  let offset
  while (!signal.aborted) {
    try {
      const updates = await callTelegram("getUpdates", {
        offset,
        limit: 20,
        timeout: POLL_TIMEOUT_SECONDS,
        allowed_updates: ["message"],
      }, { timeout: (POLL_TIMEOUT_SECONDS + 5) * 1000, signal })

      if (!await renewPollingLease(leaseToken)) {
        console.warn("Telegram polling lease lost; returning to standby")
        return
      }

      const batch = await processUpdateBatch(updates, {
        offset,
        afterEach: () => renewPollingLease(leaseToken),
      })
      offset = batch.offset
      if (batch.leaseLost) {
        console.warn("Telegram polling lease lost while processing updates")
        return
      }
      if (batch.error) {
        console.error("Unable to process Telegram update; it will be retried:", batch.error?.message || String(batch.error))
        if (!await renewPollingLease(leaseToken)) return
        await delay(5000, signal)
      }
    } catch (error) {
      if (signal.aborted) break
      console.error("Telegram polling error:", error.message)
      if (!await renewPollingLease(leaseToken)) return
      await delay(5000, signal)
    }
  }
}

const runPollingLeaderLoop = async (signal) => {
  while (!signal.aborted) {
    const leaseToken = randomUUID()
    try {
      const acquired = await acquirePollingLease(leaseToken)
      if (acquired !== "OK") {
        await delay(POLLING_RETRY_MS, signal)
        continue
      }

      console.log("Telegram bot polling leader started")
      try {
        await callTelegram("deleteWebhook", { drop_pending_updates: false })
        await pollUpdates(signal, leaseToken)
      } finally {
        await releasePollingLease(leaseToken)
      }
    } catch (error) {
      if (signal.aborted) break
      console.error("Telegram polling leader error:", error.message)
    }
    await delay(POLLING_RETRY_MS, signal)
  }
}

const startTelegramBot = () => {
  if (!getTelegramBotToken()) {
    console.log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is not configured")
    return false
  }
  if (pollingPromise) return true

  pollAbortController = new AbortController()
  pollingPromise = runPollingLeaderLoop(pollAbortController.signal)
    .finally(async () => {
      if (pollingRedis) {
        await pollingRedis.quit()
        pollingRedis = undefined
      }
      pollingPromise = undefined
      pollAbortController = undefined
    })
  console.log("Telegram bot polling standby started")
  return true
}

const closeTelegramBot = async () => {
  pollAbortController?.abort()
  await pollingPromise
}

const sendTelegramMonitorAlert = async ({ monitor, nextStatus, result, changedAt, downSince }) => {
  if (!getTelegramBotToken()) return false
  const user = await User.findById(monitor.user).select("telegramChatId").lean()
  if (!user?.telegramChatId) return false

  try {
    await sendMessage(user.telegramChatId, buildMonitorAlert({ monitor, nextStatus, result, changedAt, downSince }))
    return true
  } catch (error) {
    console.error(`Unable to send Telegram alert for monitor ${monitor._id}:`, error.message)
    return false
  }
}

module.exports = {
  buildMonitorAlert,
  closeTelegramBot,
  escapeHtml,
  formatDuration,
  handleUpdate,
  parseStartToken,
  processUpdateBatch,
  redactMonitorUrl,
  sendTelegramMonitorAlert,
  startTelegramBot,
}
