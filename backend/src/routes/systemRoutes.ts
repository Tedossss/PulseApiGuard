import { Router } from "express"
import { healthCheck, liveCheck, readyCheck } from "../controllers/systemController"

const router = Router()

router.get("/health", healthCheck)
router.get("/live", liveCheck)
router.get("/ready", readyCheck)

export default router
