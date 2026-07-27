const router = require("express").Router()
const systemController = require("../controllers/systemController")

router.get("/health", systemController.healthCheck)

module.exports = router