const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth")
const {
  getSession,
  loginUser,
  logoutUser,
  registerUser,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/session", auth, getSession);
router.post("/logout", logoutUser);

module.exports = router;
