import { randomBytes } from "node:crypto"
import type { Request, Response } from "express"
import { requireUserId } from "../middleware/auth"
import User from "../models/User"
import { sendError } from "../utils/errors"
import {
  getTelegramBotToken,
  getTelegramBotUsername,
  hashTelegramLinkToken,
} from "../utils/telegram"

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000

export const getStatus = async (req: Request, res: Response) => {
  const user = await User.findById(requireUserId(req))
    .select("telegramChatId telegramUsername telegramLinkedAt")
    .lean()

  if (!user) return sendError(res, 404, "User not found")

  return res.json({
    configured: Boolean(getTelegramBotToken() && getTelegramBotUsername()),
    connected: Boolean(user.telegramChatId),
    username: user.telegramUsername || null,
    linkedAt: user.telegramLinkedAt || null,
  })
}

export const createLink = async (req: Request, res: Response) => {
  const botUsername = getTelegramBotUsername()
  if (!getTelegramBotToken() || !botUsername) {
    return sendError(res, 503, "Telegram notifications are not configured")
  }

  const token = randomBytes(24).toString("base64url")
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS)
  const user = await User.findByIdAndUpdate(requireUserId(req), {
    $set: {
      telegramLinkTokenHash: hashTelegramLinkToken(token),
      telegramLinkTokenExpiresAt: expiresAt,
    },
  })

  if (!user) return sendError(res, 404, "User not found")

  return res.json({ link: `https://t.me/${botUsername}?start=${token}`, expiresAt })
}

export const disconnect = async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(requireUserId(req), {
    $unset: {
      telegramChatId: 1,
      telegramUsername: 1,
      telegramLinkedAt: 1,
      telegramLinkTokenHash: 1,
      telegramLinkTokenExpiresAt: 1,
    },
  })

  if (!user) return sendError(res, 404, "User not found")
  return res.status(204).end()
}
