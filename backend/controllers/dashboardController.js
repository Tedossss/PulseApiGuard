const EndpointMonitor = require("../models/EndpointMonitor")
const MonitoringLog = require("../models/MonitoringLog")

exports.getSummary = async (req, res) => {

  try {

    const userId = req.user

    const monitors = await EndpointMonitor.find({
      user: userId
    })

    const monitorIds = monitors.map(m => m._id)

    // 🔥 batch logs fetch (important)
    const logs = await MonitoringLog.find({
      monitor: { $in: monitorIds }
    }).sort({ createdAt: -1 })

    const summary = monitors.map(monitor => {

      const monitorLogs = logs.filter(
        log => log.monitor.toString() === monitor._id.toString()
      )

      const total = monitorLogs.length
      const success = monitorLogs.filter(l => l.success).length

      const uptime = total === 0
        ? 100
        : Number(((success / total) * 100).toFixed(2))
      const latestLog = monitorLogs[0]

      return {
        _id: monitor._id,
        id: monitor._id,
        name: monitor.name,
        url: monitor.url,
        method: monitor.method,
        expectedStatus: monitor.expectedStatus,
        interval: monitor.interval,
        status: monitor.status,
        uptimePercentage: uptime,
        lastStatus: monitor.lastStatus,
        lastChecked: monitor.lastChecked,
        responseTime: latestLog?.responseTime,
        downSince: monitor.downSince,
        failureCount: monitor.failureCount
      }

    })

    res.json(summary)

  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: "Server error"
    })
  }
}

exports.getTrend = async (req, res) => {
  try {
    const userId = req.user

    const monitors = await EndpointMonitor.find({ user: userId }).select("_id")
    const monitorIds = monitors.map(monitor => monitor._id)

    if (monitorIds.length === 0) {
      return res.json([])
    }

    const logs = await MonitoringLog.find({
      monitor: { $in: monitorIds }
    })
      .sort({ createdAt: -1 })
      .limit(120)
      .lean()

    const buckets = new Map()

    logs.forEach(log => {
      const checkedAt = log.createdAt
      const bucketTime = new Date(checkedAt)
      bucketTime.setSeconds(0, 0)

      const key = bucketTime.toISOString()
      const current = buckets.get(key) || {
        checkedAt: key,
        total: 0,
        successful: 0,
        responseTimeTotal: 0,
        responseTimeCount: 0
      }

      current.total += 1
      if (log.success) current.successful += 1
      if (typeof log.responseTime === "number") {
        current.responseTimeTotal += log.responseTime
        current.responseTimeCount += 1
      }

      buckets.set(key, current)
    })

    const trend = Array.from(buckets.values())
      .sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt))
      .map(bucket => ({
        checkedAt: bucket.checkedAt,
        uptime: bucket.total === 0
          ? 0
          : Number(((bucket.successful / bucket.total) * 100).toFixed(1)),
        latency: bucket.responseTimeCount === 0
          ? 0
          : Math.round(bucket.responseTimeTotal / bucket.responseTimeCount)
      }))

    return res.json(trend)
  } catch (err) {
    console.error("GetTrend Error:", err)

    return res.status(500).json({
      error: "Server error"
    })
  }
}
