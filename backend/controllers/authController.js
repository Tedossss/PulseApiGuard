const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
  serializeExpiredSessionCookie,
  serializeSessionCookie,
} = require("../utils/session")

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
    issuer: "pulseguard-api",
    audience: "pulseguard-web",
  });
};

const useSecureCookies = () => {
  if (process.env.SESSION_COOKIE_SECURE !== undefined) {
    return process.env.SESSION_COOKIE_SECURE === "true"
  }
  return process.env.NODE_ENV === "production"
}

const setSessionCookie = (res, token) => {
  const decoded = jwt.decode(token)
  const maxAgeSeconds = typeof decoded?.exp === "number"
    ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1000))
    : undefined

  res.setHeader("Set-Cookie", serializeSessionCookie(token, {
    maxAgeSeconds,
    secure: useSecureCookies(),
  }))
}

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

    const token = generateToken(user._id)
    setSessionCookie(res, token)
    res.json({
      _id: user._id,
      email: user.email,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Unable to sign in" });
  }
};

exports.getSession = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("email").lean()
    if (!user) return res.status(401).json({ message: "Session user no longer exists" })
    return res.json({ _id: user._id, email: user.email })
  } catch (error) {
    console.error("Get session error:", error)
    return res.status(500).json({ message: "Unable to read session" })
  }
}

exports.logoutUser = (req, res) => {
  res.setHeader("Set-Cookie", serializeExpiredSessionCookie({ secure: useSecureCookies() }))
  return res.status(204).end()
}
