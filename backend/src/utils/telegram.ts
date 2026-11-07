import { createHash } from "node:crypto"

export const getTelegramBotToken = () => String(process.env.TELEGRAM_BOT_TOKEN || "").trim()

export const getTelegramBotUsername = () => {
  const username = String(process.env.TELEGRAM_BOT_USERNAME || "")
    .trim()
    .replace(/^@/, "")
  return /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : ""
}

export const hashTelegramLinkToken = (token: string) =>
  createHash("sha256").update(String(token)).digest("hex")
