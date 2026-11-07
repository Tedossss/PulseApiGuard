const router = require("express").Router()
const systemController = require("../controllers/systemController")

router.get("/health", systemController.healthCheck)
router.get("/live", systemController.liveCheck)
router.get("/ready", systemController.readyCheck)

module.exports = router
