const mongoose = require("mongoose")
const EndpointMonitor = require("../models/EndpointMonitor")
const MonitoringLog = require("../models/MonitoringLog")

const DEFAULT_LOG_LIMIT = 50
const MAX_LOG_LIMIT = 100
const DEFAULT_TREND_HOURS = 24
const MAX_TREND_HOURS = 24 * 7

const normalizeBoundedInteger = (value, fallback, min, max) => {
  if (value === undefined || value === null || value === "") return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

const normalizeLogLimit = value => normalizeBoundedInteger(
  value,
  DEFAULT_LOG_LIMIT,
  1,
  MAX_LOG_LIMIT,
)

const normalizeTrendHours = value => normalizeBoundedInteger(
  value,
  DEFAULT_TREND_HOURS,
  1,
  MAX_TREND_HOURS,
)

const encodeCursor = log => Buffer.from(JSON.stringify({
  createdAt: log.createdAt.toISOString(),
  id: log._id.toString(),
})).toString("base64url")

const decodeCursor = (value) => {
  if (!value) return null
  if (typeof value !== "string" || value.length > 512) {
    throw new Error("Invalid cursor")
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    const createdAt = new Date(parsed.createdAt)
    if (Number.isNaN(createdAt.getTime()) || !mongoose.isValidObjectId(parsed.id)) {
      throw new Error("Invalid cursor")
    }
    return { createdAt, id: new mongoose.Types.ObjectId(parsed.id) }
  } catch {
    throw new Error("Invalid cursor")
  }
}

const getUserMonitorIds = async (userId) => {
  const monitors = await EndpointMonitor.find({ user: userId }).select("_id").lean()
  return monitors.map(monitor => monitor._id)
}

exports.getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user)
    const summary = await EndpointMonitor.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: MonitoringLog.collection.name,
          let: { monitorId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$monitor", "$$monitorId"] } } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                successful: { $sum: { $cond: ["$success", 1, 0] } },
                responseTime: { $first: "$responseTime" },
              },
            },
          ],
          as: "logStats",
        },
      },
      { $set: { logStats: { $first: "$logStats" } } },
      {
        $project: {
          _id: 1,
          id: "$_id",
          name: 1,
          url: 1,
          method: 1,
          expectedStatus: 1,
          interval: 1,
          status: 1,
          lastStatus: 1,
          lastChecked: 1,
          downSince: 1,
          failureCount: 1,
          responseTime: "$logStats.responseTime",
          uptimePercentage: {
            $cond: [
              { $gt: [{ $ifNull: ["$logStats.total", 0] }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$logStats.successful", "$logStats.total"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { name: 1, _id: 1 } },
    ])

    return res.json(summary)
  } catch (error) {
    console.error("GetSummary Error:", error)
    return res.status(500).json({ error: "Server error" })
  }
}

exports.getTrend = async (req, res) => {
  try {
    const monitorIds = await getUserMonitorIds(req.user)
    if (monitorIds.length === 0) return res.json([])

    const hours = normalizeTrendHours(req.query.hours)
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const binSize = hours > 48 ? 60 : 5

    const trend = await MonitoringLog.aggregate([
      { $match: { monitor: { $in: monitorIds }, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$createdAt",
              unit: "minute",
              binSize,
            },
          },
          total: { $sum: 1 },
          successful: { $sum: { $cond: ["$success", 1, 0] } },
          latency: { $avg: "$responseTime" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          checkedAt: "$_id",
          uptime: {
            $round: [
              { $multiply: [{ $divide: ["$successful", "$total"] }, 100] },
              1,
            ],
          },
          latency: { $round: [{ $ifNull: ["$latency", 0] }, 0] },
        },
      },
    ])

    return res.json(trend)
  } catch (error) {
    console.error("GetTrend Error:", error)
    return res.status(500).json({ error: "Server error" })
  }
}

exports.getLogs = async (req, res) => {
  try {
    const monitorIds = await getUserMonitorIds(req.user)
    if (monitorIds.length === 0) return res.json({ logs: [], nextCursor: null })

    let selectedMonitorIds = monitorIds
    if (req.query.monitorId) {
      if (!mongoose.isValidObjectId(req.query.monitorId)) {
        return res.status(400).json({ error: "Invalid monitor id" })
      }

      const requestedId = req.query.monitorId.toString()
      const ownedMonitor = monitorIds.find(id => id.toString() === requestedId)
      if (!ownedMonitor) return res.status(404).json({ error: "Monitor not found" })
      selectedMonitorIds = [ownedMonitor]
    }

    let cursor
    try {
      cursor = decodeCursor(req.query.cursor)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }

    const limit = normalizeLogLimit(req.query.limit)
    const query = { monitor: { $in: selectedMonitorIds } }
    if (cursor) {
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ]
    }

    const rows = await MonitoringLog.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("monitor", "name url")
      .lean()

    const hasMore = rows.length > limit
    const logs = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? encodeCursor(logs[logs.length - 1]) : null

    return res.json({ logs, nextCursor })
  } catch (error) {
    console.error("GetLogs Error:", error)
    return res.status(500).json({ error: "Server error" })
  }
}

exports.decodeCursor = decodeCursor
exports.encodeCursor = encodeCursor
exports.normalizeLogLimit = normalizeLogLimit
exports.normalizeTrendHours = normalizeTrendHours
