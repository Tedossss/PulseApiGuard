import type { Request } from "express"

export const SESSION_COOKIE_NAME = "pulseguard_session"
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60

export const parseCookies = (header: unknown = ""): Record<string, string> => {
  if (typeof header !== "string" || header.length > 8192) return {}

  return header.split(";").reduce<Record<string, string>>((cookies, part) => {
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

export const getBearerToken = (authorization: unknown = ""): string | null => {
  const [scheme, token, extra] = String(authorization).trim().split(/\s+/)
  return scheme === "Bearer" && token && !extra ? token : null
}

export const getSessionToken = (req: Pick<Request, "headers">): string | undefined => {
  const cookies = parseCookies(req.headers?.cookie || "")
  return getBearerToken(req.headers?.authorization || "") || cookies[SESSION_COOKIE_NAME]
}

const normalizeMaxAge = (value: unknown) => {
  const seconds = Number(value)
  return Number.isInteger(seconds) && seconds > 0 ? seconds : DEFAULT_SESSION_MAX_AGE_SECONDS
}

interface CookieOptions {
  maxAgeSeconds?: number
  secure?: boolean
}

export const serializeSessionCookie = (
  token: string,
  { maxAgeSeconds, secure = false }: CookieOptions = {},
) => {
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

export const serializeExpiredSessionCookie = ({ secure = false }: CookieOptions = {}) => {
  const parts = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"]
  if (secure) parts.push("Secure")
  return parts.join("; ")
}
