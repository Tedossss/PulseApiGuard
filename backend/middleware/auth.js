const jwt = require("jsonwebtoken");
const { getSessionToken } = require("../utils/session")

module.exports = function (req, res, next) {
  const token = getSessionToken(req)

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "pulseguard-api",
      audience: "pulseguard-web",
    });
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired session" });
  }
};
