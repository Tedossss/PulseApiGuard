import { Router } from "express"
import {
  createMonitor,
  deleteMonitor,
  getMonitorById,
  getMonitors,
  updateMonitor,
} from "../controllers/monitorController"
import auth from "../middleware/auth"

const router = Router()

router.post("/add", auth, createMonitor)
router.get("/", auth, getMonitors)
router.get("/:id", auth, getMonitorById)
router.put("/:id", auth, updateMonitor)
router.delete("/:id", auth, deleteMonitor)

export default router
