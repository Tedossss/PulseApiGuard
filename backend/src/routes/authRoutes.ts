import { Router } from "express"
import { getSession, loginUser, logoutUser, registerUser } from "../controllers/authController"
import auth from "../middleware/auth"

const router = Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/session", auth, getSession)
router.post("/logout", logoutUser)

export default router
