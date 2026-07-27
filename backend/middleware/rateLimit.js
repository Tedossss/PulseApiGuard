const createRateLimiter = ({ windowMs, max, message }) => {
  const buckets = new Map()

  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || req.socket.remoteAddress || "unknown"
    const current = buckets.get(key)
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current

    bucket.count += 1
    buckets.set(key, bucket)

    res.setHeader("RateLimit-Limit", max)
    res.setHeader("RateLimit-Remaining", Math.max(0, max - bucket.count))
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000))

    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000))
      return res.status(429).json({ message })
    }

    return next()
  }
}

module.exports = createRateLimiter
