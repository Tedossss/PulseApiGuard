exports.healthCheck = async (req, res) => {
  try {
    res.json({
      status: "ok",
      uptime: process.uptime()
    })
  } catch (err) {
    res.status(500).json({ status: "error" })
  }
}
