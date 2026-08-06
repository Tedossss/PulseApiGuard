const router = require("express").Router()
const auth = require("../middleware/auth")
const telegramController = require("../controllers/telegramController")

router.get("/status", auth, telegramController.getStatus)
router.post("/link", auth, telegramController.createLink)
router.delete("/link", auth, telegramController.disconnect)

module.exports = router
