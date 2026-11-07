import type { Request, Response } from "express"
import jwt, { type SignOptions } from "jsonwebtoken"
import { JWT_AUDIENCE, JWT_ISSUER, requireUserId } from "../middleware/auth"
import User from "../models/User"
import { sendError } from "../utils/errors"
import { serializeExpiredSessionCookie, serializeSessionCookie } from "../utils/session"

const generateToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET ?? "", {
    expiresIn: (process.env.JWT_EXPIRES_IN || "12h") as SignOptions["expiresIn"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })

const useSecureCookies = () => {
  if (process.env.SESSION_COOKIE_SECURE !== undefined) {
    return process.env.SESSION_COOKIE_SECURE === "true"
  }
  return process.env.NODE_ENV === "production"
}

const setSessionCookie = (res: Response, token: string) => {
  const decoded = jwt.decode(token)
  const exp = typeof decoded === "object" ? decoded?.exp : undefined
  const maxAgeSeconds =
    typeof exp === "number" ? Math.max(1, exp - Math.floor(Date.now() / 1000)) : undefined

  res.setHeader(
    "Set-Cookie",
    serializeSessionCookie(token, { maxAgeSeconds, secure: useSecureCookies() }),
  )
}

const normalizeCredentials = (body: unknown) => {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  return {
    email: String(input.email || "")
      .trim()
      .toLowerCase(),
    password: String(input.password || ""),
  }
}

const validateCredentials = ({ email, password }: { email: string; password: string }) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "A valid email is required"
  if (password.length < 8 || password.length > 128) {
    return "Password must contain 8 to 128 characters"
  }
  return null
}

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = normalizeCredentials(req.body)
  const validationError = validateCredentials({ email, password })
  if (validationError) return sendError(res, 400, validationError)

  try {
    if (await User.exists({ email })) {
      return sendError(res, 409, "An account already exists for this email")
    }

    const user = await User.create({ email, password })
    return res.status(201).json({ _id: user._id, email: user.email })
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return sendError(res, 409, "An account already exists for this email")
    }
    console.error("Registration error:", error)
    return sendError(res, 500, "Unable to create account")
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = normalizeCredentials(req.body)
  if (!email || !password) return sendError(res, 400, "Email and password are required")

  try {
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 400, "Invalid credentials")
    }

    setSessionCookie(res, generateToken(user._id.toString()))
    return res.json({ _id: user._id, email: user.email })
  } catch (error) {
    console.error("Login error:", error)
    return sendError(res, 500, "Unable to sign in")
  }
}

export const getSession = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(requireUserId(req)).select("email").lean()
    if (!user) return sendError(res, 401, "Session user no longer exists")
    return res.json({ _id: user._id, email: user.email })
  } catch (error) {
    console.error("Get session error:", error)
    return sendError(res, 500, "Unable to read session")
  }
}

export const logoutUser = (_req: Request, res: Response) => {
  res.setHeader("Set-Cookie", serializeExpiredSessionCookie({ secure: useSecureCookies() }))
  return res.status(204).end()
}
