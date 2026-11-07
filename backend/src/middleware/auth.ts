import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { sendError } from "../utils/errors"
import { getSessionToken } from "../utils/session"

export const JWT_ISSUER = "pulseguard-api"
export const JWT_AUDIENCE = "pulseguard-web"

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = getSessionToken(req)
  if (!token) return sendError(res, 401, "Authentication required")

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "", {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    if (typeof decoded === "string" || typeof decoded.id !== "string") {
      return sendError(res, 401, "Invalid or expired session")
    }
    req.user = decoded.id
    next()
  } catch {
    return sendError(res, 401, "Invalid or expired session")
  }
}

/** Reads the user id set by `auth`; only call it from routes behind that middleware. */
export const requireUserId = (req: Request) => {
  if (!req.user) throw new Error("requireUserId called on an unauthenticated route")
  return req.user
}

export default auth
