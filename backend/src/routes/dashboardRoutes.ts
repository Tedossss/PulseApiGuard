import { Router } from "express"
import { getLogs, getSummary, getTrend } from "../controllers/dashboardController"
import auth from "../middleware/auth"

const router = Router()

router.get("/summary", auth, getSummary)
router.get("/trend", auth, getTrend)
router.get("/logs", auth, getLogs)

export default router
