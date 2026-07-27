const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
    issuer: "pulseguard-api",
    audience: "pulseguard-web",
  });
};

const normalizeCredentials = (body = {}) => ({
  email: String(body.email || "").trim().toLowerCase(),
  password: String(body.password || ""),
});

const validateCredentials = ({ email, password }) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "A valid email is required";
  if (password.length < 8 || password.length > 128) return "Password must contain 8 to 128 characters";
  return null;
};

// Register
exports.registerUser = async (req, res) => {
  const { email, password } = normalizeCredentials(req.body);
  const validationError = validateCredentials({ email, password });
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(409).json({ message: "An account already exists for this email" });

    const user = await User.create({ email, password });
    res.status(201).json({
      _id: user._id,
      email: user.email,
      telegram_chat_id: user.telegram_chat_id,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Unable to create account" });
  }
};

// Login
exports.loginUser = async (req, res) => {
  const { email, password } = normalizeCredentials(req.body);
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      email: user.email,
      telegram_chat_id: user.telegram_chat_id,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Unable to sign in" });
  }
};
