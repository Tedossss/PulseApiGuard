const express = require("express");
const router = express.Router();
const testApiEndpoint = require("../services/apiTester");
const auth = require("../middleware/auth");
const createRateLimiter = require("../middleware/rateLimit");
const { normalizeMonitorFields } = require("../controllers/monitorController");

const testRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many manual endpoint tests. Try again shortly.",
  prefix: "manual-test",
});

router.post("/", auth, testRateLimiter, async (req, res) => {
  let monitor;
  try {
    monitor = normalizeMonitorFields(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const result = await testApiEndpoint(monitor);

  return res.json(result);
});

module.exports = router;
