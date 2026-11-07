import { Router } from "express"
import { createLink, disconnect, getStatus } from "../controllers/telegramController"
import auth from "../middleware/auth"

const router = Router()

router.get("/status", auth, getStatus)
router.post("/link", auth, createLink)
router.delete("/link", auth, disconnect)

export default router
