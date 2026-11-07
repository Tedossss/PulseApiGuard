declare global {
  namespace Express {
    interface Request {
      /** Authenticated user id, set by the auth middleware. */
      user?: string
    }
  }
}

export {}
