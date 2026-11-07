const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const monitorController = require("../controllers/monitorController")

// Створення
router.post("/add", auth, monitorController.createMonitor)

// Отримання всіх
router.get("/", auth, monitorController.getMonitors)

// ОНОВЛЕННЯ (додай це)
router.put("/:id", auth, monitorController.updateMonitor)

// ВИДАЛЕННЯ (додай це)
router.delete("/:id", auth, monitorController.deleteMonitor)

module.exports = router