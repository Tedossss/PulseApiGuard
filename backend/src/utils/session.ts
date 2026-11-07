const SESSION_COOKIE_NAME = "pulseguard_session"
const DEFAULT_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60

const parseCookies = (header = "") => {
  if (typeof header !== "string" || header.length > 8192) return {}

  return header.split(";").reduce((cookies, part) => {
    const separator = part.indexOf("=")
    if (separator < 1) return cookies

    const name = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    try {
      cookies[name] = decodeURIComponent(value)
    } catch {
      cookies[name] = value
    }
    return cookies
  }, {})
}

const getBearerToken = (authorization = "") => {
  const [scheme, token, extra] = String(authorization).trim().split(/\s+/)
  return scheme === "Bearer" && token && !extra ? token : null
}

const getSessionToken = (req) => {
  const cookies = parseCookies(req.headers?.cookie || "")
  return getBearerToken(req.headers?.authorization || "") || cookies[SESSION_COOKIE_NAME]
}

const normalizeMaxAge = (value) => {
  const seconds = Number(value)
  return Number.isInteger(seconds) && seconds > 0
    ? seconds
    : DEFAULT_SESSION_MAX_AGE_SECONDS
}

const serializeSessionCookie = (token, { maxAgeSeconds, secure = false } = {}) => {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${normalizeMaxAge(maxAgeSeconds)}`,
  ]
  if (secure) parts.push("Secure")
  return parts.join("; ")
}

const serializeExpiredSessionCookie = ({ secure = false } = {}) => {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
  ]
  if (secure) parts.push("Secure")
  return parts.join("; ")
}

module.exports = {
  DEFAULT_SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  getBearerToken,
  getSessionToken,
  parseCookies,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
}
