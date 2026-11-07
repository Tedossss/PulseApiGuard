import { Router } from "express"
import { normalizeMonitorFields, type MonitorFields } from "../controllers/monitorController"
import auth from "../middleware/auth"
import createRateLimiter from "../middleware/rateLimit"
import testApiEndpoint from "../services/apiTester"
import { errorMessage, sendError } from "../utils/errors"

// A factory, so the Redis-backed rate limiter is created with the app rather than on import.
const createTestRoutes = () => {
  const router = Router()

  const testRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many manual endpoint tests. Try again shortly.",
    prefix: "manual-test",
  })

  router.post("/", auth, testRateLimiter, async (req, res) => {
    let monitor: MonitorFields
    try {
      monitor = normalizeMonitorFields(req.body)
    } catch (error) {
      return sendError(res, 400, errorMessage(error))
    }

    return res.json(await testApiEndpoint(monitor))
  })

  return router
}

export default createTestRoutes
