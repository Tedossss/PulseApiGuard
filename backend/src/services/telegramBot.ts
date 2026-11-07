import { randomUUID } from "node:crypto"
import axios from "axios"
import type IORedis from "ioredis"
import type { Types } from "mongoose"
import { createRedisConnection } from "../config/redis"
import User from "../models/User"
import { errorMessage } from "../utils/errors"
import { getTelegramBotToken, hashTelegramLinkToken } from "../utils/telegram"
import type { CheckResult } from "./apiTester"

const POLL_TIMEOUT_SECONDS = 25
const POLLING_LEASE_KEY = "pulseguard:telegram-polling-leader"
const POLLING_LEASE_TTL_MS = 60 * 1000
const POLLING_RETRY_MS = 10 * 1000

const RENEW_LEASE_SCRIPT =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end"
const RELEASE_LEASE_SCRIPT =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"

export interface TelegramMessage {
  text?: string
  chat?: { id: number | string; type?: string }
  from?: { username?: string }
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

export interface AlertMonitor {
  _id?: Types.ObjectId | string
  user?: Types.ObjectId | string
  name: string
  url: string
  expectedStatus?: number | null
  downSince?: Date | null
}

export interface MonitorAlert {
  monitor: AlertMonitor
  nextStatus: string
  result: Pick<CheckResult, "statusCode">
  changedAt?: Date
  downSince?: Date | null
}

let pollAbortController: AbortController | undefined
let pollingPromise: Promise<void> | undefined
let pollingRedis: IORedis | undefined

const callTelegram = async <T = unknown>(
  method: string,
  payload: Record<string, unknown>,
  options: { timeout?: number; signal?: AbortSignal } = {},
): Promise<T> => {
  const token = getTelegramBotToken()
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured")

  let response
  try {
    response = await axios.post<{ ok?: boolean; result: T }>(
      `https://api.telegram.org/bot${token}/${method}`,
      payload,
      { timeout: options.timeout || 10000, signal: options.signal },
    )
  } catch (error) {
    const description = axios.isAxiosError(error) ? error.response?.data?.description : undefined
    throw new Error(`Telegram ${method}: ${description || errorMessage(error)}`)
  }

  if (!response.data?.ok) throw new Error(`Telegram ${method} request failed`)
  return response.data.result
}

const delay = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, milliseconds)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout)
        resolve()
      },
      { once: true },
    )
  })

const getPollingRedis = () => {
  pollingRedis ??= createRedisConnection("Telegram polling")
  return pollingRedis
}

const acquirePollingLease = (leaseToken: string) =>
  getPollingRedis().set(POLLING_LEASE_KEY, leaseToken, "PX", POLLING_LEASE_TTL_MS, "NX")

const renewPollingLease = async (leaseToken: string) => {
  const renewed = await getPollingRedis().eval(
    RENEW_LEASE_SCRIPT,
    1,
    POLLING_LEASE_KEY,
    leaseToken,
    POLLING_LEASE_TTL_MS,
  )
  return renewed === 1
}

const releasePollingLease = (leaseToken: string) =>
  getPollingRedis().eval(RELEASE_LEASE_SCRIPT, 1, POLLING_LEASE_KEY, leaseToken)

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

export const redactMonitorUrl = (value: unknown) => {
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

export const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export const buildMonitorAlert = ({
  monitor,
  nextStatus,
  result,
  changedAt = new Date(),
  downSince = monitor.downSince,
}: MonitorAlert) => {
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
    lines.push(
      `Downtime: <b>${formatDuration(changedAt.getTime() - new Date(downSince).getTime())}</b>`,
    )
  }

  return lines.join("\n")
}

const sendMessage = (chatId: number | string, text: string) =>
  callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  })

/** Returns the link token, "" for a bare /start, or null when the text is not a start command. */
export const parseStartToken = (text: unknown) => {
  if (typeof text !== "string") return null
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?$/)
  return match ? match[1] || "" : null
}

const CONNECTED_MESSAGE =
  "✅ Telegram alerts are connected. PulseGuard will notify you when an endpoint goes down or recovers."

const linkTelegramChat = async (message: TelegramMessage, token: string) => {
  const chat = message.chat
  if (!chat || chat.type !== "private") return

  if (!token) {
    await sendMessage(
      chat.id,
      "Open the connection link from PulseGuard Settings to enable alerts.",
    )
    return
  }

  const telegramUsername = message.from?.username
  const update = {
    $set: {
      telegramChatId: String(chat.id),
      telegramLinkedAt: new Date(),
      ...(telegramUsername ? { telegramUsername } : {}),
    },
    $unset: {
      telegramLinkTokenHash: 1,
      telegramLinkTokenExpiresAt: 1,
      ...(!telegramUsername ? { telegramUsername: 1 } : {}),
    },
  }

  let user
  try {
    user = await User.findOneAndUpdate(
      {
        telegramLinkTokenHash: hashTelegramLinkToken(token),
        telegramLinkTokenExpiresAt: { $gt: new Date() },
      },
      update,
      { new: true, runValidators: true },
    )
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      await sendMessage(
        chat.id,
        "This Telegram chat is already connected to another PulseGuard account.",
      )
      return
    }
    throw error
  }

  if (!user) {
    const alreadyConnected = await User.exists({ telegramChatId: String(chat.id) })
    await sendMessage(
      chat.id,
      alreadyConnected
        ? CONNECTED_MESSAGE
        : "This connection link is invalid or expired. Generate a new one in PulseGuard Settings.",
    )
    return
  }

  await sendMessage(chat.id, CONNECTED_MESSAGE)
}

export const handleUpdate = async (update: TelegramUpdate) => {
  const message = update.message
  if (!message || typeof message.text !== "string") return

  const token = parseStartToken(message.text)
  if (token !== null) await linkTelegramChat(message, token)
}

interface BatchOptions {
  offset?: number
  handler?: (update: TelegramUpdate) => Promise<void>
  afterEach?: () => Promise<boolean>
}

interface BatchResult {
  offset?: number
  error?: unknown
  leaseLost?: boolean
}

export const processUpdateBatch = async (
  updates: TelegramUpdate[],
  { offset, handler = handleUpdate, afterEach = async () => true }: BatchOptions = {},
): Promise<BatchResult> => {
  let nextOffset = offset
  for (const update of updates) {
    try {
      await handler(update)
    } catch (error) {
      return { offset: nextOffset, error }
    }

    nextOffset = update.update_id + 1
    if (!(await afterEach())) return { offset: nextOffset, leaseLost: true }
  }
  return { offset: nextOffset }
}

const pollUpdates = async (signal: AbortSignal, leaseToken: string) => {
  let offset: number | undefined
  while (!signal.aborted) {
    try {
      const updates = await callTelegram<TelegramUpdate[]>(
        "getUpdates",
        {
          offset,
          limit: 20,
          timeout: POLL_TIMEOUT_SECONDS,
          allowed_updates: ["message"],
        },
        { timeout: (POLL_TIMEOUT_SECONDS + 5) * 1000, signal },
      )

      if (!(await renewPollingLease(leaseToken))) {
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
        console.error(
          "Unable to process Telegram update; it will be retried:",
          errorMessage(batch.error),
        )
        if (!(await renewPollingLease(leaseToken))) return
        await delay(5000, signal)
      }
    } catch (error) {
      if (signal.aborted) break
      console.error("Telegram polling error:", errorMessage(error))
      if (!(await renewPollingLease(leaseToken))) return
      await delay(5000, signal)
    }
  }
}

const runPollingLeaderLoop = async (signal: AbortSignal) => {
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
      console.error("Telegram polling leader error:", errorMessage(error))
    }
    await delay(POLLING_RETRY_MS, signal)
  }
}

export const startTelegramBot = () => {
  if (!getTelegramBotToken()) {
    console.log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is not configured")
    return false
  }
  if (pollingPromise) return true

  pollAbortController = new AbortController()
  pollingPromise = runPollingLeaderLoop(pollAbortController.signal).finally(async () => {
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

export const closeTelegramBot = async () => {
  pollAbortController?.abort()
  await pollingPromise
}

export const sendTelegramMonitorAlert = async (alert: MonitorAlert) => {
  if (!getTelegramBotToken()) return false
  const user = await User.findById(alert.monitor.user).select("telegramChatId").lean()
  if (!user?.telegramChatId) return false

  try {
    await sendMessage(user.telegramChatId, buildMonitorAlert(alert))
    return true
  } catch (error) {
    console.error(
      `Unable to send Telegram alert for monitor ${String(alert.monitor._id)}:`,
      errorMessage(error),
    )
    return false
  }
}
