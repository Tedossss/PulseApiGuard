const { randomBytes } = require("node:crypto")
const User = require("../models/User")
const {
  getTelegramBotToken,
  getTelegramBotUsername,
  hashTelegramLinkToken,
} = require("../utils/telegram")

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000

const getStatus = async (req, res) => {
  const user = await User.findById(req.user)
    .select("telegramChatId telegramUsername telegramLinkedAt")
    .lean()

  if (!user) return res.status(404).json({ message: "User not found" })

  return res.json({
    configured: Boolean(getTelegramBotToken() && getTelegramBotUsername()),
    connected: Boolean(user.telegramChatId),
    username: user.telegramUsername || null,
    linkedAt: user.telegramLinkedAt || null,
  })
}

const createLink = async (req, res) => {
  const botUsername = getTelegramBotUsername()
  if (!getTelegramBotToken() || !botUsername) {
    return res.status(503).json({ message: "Telegram notifications are not configured" })
  }

  const token = randomBytes(24).toString("base64url")
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS)
  const user = await User.findByIdAndUpdate(req.user, {
    $set: {
      telegramLinkTokenHash: hashTelegramLinkToken(token),
      telegramLinkTokenExpiresAt: expiresAt,
    },
  })

  if (!user) return res.status(404).json({ message: "User not found" })

  return res.json({
    link: `https://t.me/${botUsername}?start=${token}`,
    expiresAt,
  })
}

const disconnect = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user, {
    $unset: {
      telegramChatId: 1,
      telegramUsername: 1,
      telegramLinkedAt: 1,
      telegramLinkTokenHash: 1,
      telegramLinkTokenExpiresAt: 1,
    },
  })

  if (!user) return res.status(404).json({ message: "User not found" })
  return res.status(204).end()
}

module.exports = {
  createLink,
  disconnect,
  getStatus,
}
