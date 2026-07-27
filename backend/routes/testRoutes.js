const express = require("express");
const router = express.Router();
const testApiEndpoint = require("../services/apiTester");
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
  const monitor = req.body;

  const result = await testApiEndpoint(monitor);

  res.json(result);
});

module.exports = router;
