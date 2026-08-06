const { createHash } = require("node:crypto")

const getTelegramBotToken = () => String(process.env.TELEGRAM_BOT_TOKEN || "").trim()

const getTelegramBotUsername = () => {
  const username = String(process.env.TELEGRAM_BOT_USERNAME || "")
  .trim()
  .replace(/^@/, "")
  return /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : ""
}

const hashTelegramLinkToken = (token) => createHash("sha256")
  .update(String(token))
  .digest("hex")

module.exports = {
  getTelegramBotToken,
  getTelegramBotUsername,
  hashTelegramLinkToken,
}
