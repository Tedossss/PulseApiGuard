import type { Response } from "express"

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

/** Every API error response uses the same `{ error, code? }` shape. */
export const sendError = (res: Response, status: number, error: string, code?: string) =>
  res.status(status).json(code ? { error, code } : { error })
