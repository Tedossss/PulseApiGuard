const express = require("express")
const router = express.Router()

const auth = require("../middleware/auth")
const dashboardController = require("../controllers/dashboardController")

router.get("/summary", auth, dashboardController.getSummary)
router.get("/trend", auth, dashboardController.getTrend)

module.exports = router
