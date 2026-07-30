const EndpointMonitor = require("../models/EndpointMonitor")
const MonitoringLog = require("../models/MonitoringLog")
const mongoose = require("mongoose")
const { normalizeTargetUrl, normalizeMethod } = require("../services/apiTester")
const {
  removeMonitorSchedule,
  scheduleMonitor,
} = require("../queues/monitorQueue")

const DEFAULT_INTERVAL_SECONDS = 60
const MIN_INTERVAL_SECONDS = 30
const MAX_INTERVAL_SECONDS = 86400
const DEFAULT_MAX_MONITORS_PER_USER = 20

const getMaxMonitorsPerUser = () => {
  const configured = Number(process.env.MAX_MONITORS_PER_USER)
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_MONITORS_PER_USER
}

const normalizeInterval = (value) => {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_INTERVAL_SECONDS
  }

  const interval = Number(value)
  if (
    !Number.isInteger(interval) ||
    interval < MIN_INTERVAL_SECONDS ||
    interval > MAX_INTERVAL_SECONDS
  ) {
    throw new Error(`Interval must be an integer from ${MIN_INTERVAL_SECONDS} to ${MAX_INTERVAL_SECONDS} seconds`)
  }
  return interval
}

const normalizeExpectedStatus = (value) => {
  const status = Number(value ?? 200)
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new Error("Expected status must be an integer from 100 to 599")
  }
  return status
}

const normalizeName = (value, fallback) => {
  const name = String(value || fallback || "").trim()
  if (!name || name.length > 120) {
    throw new Error("Monitor name must contain 1 to 120 characters")
  }
  return name
}

const normalizeMonitorFields = (input = {}, { partial = false } = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Request body must be a JSON object")
  }

  const fields = {}

  if (!partial || input.url !== undefined) fields.url = normalizeTargetUrl(input.url)
  if (!partial || input.method !== undefined) fields.method = normalizeMethod(input.method)
  if (!partial || input.expectedStatus !== undefined) fields.expectedStatus = normalizeExpectedStatus(input.expectedStatus)
  if (!partial || input.interval !== undefined) fields.interval = normalizeInterval(input.interval)
  if (!partial || input.name !== undefined) fields.name = normalizeName(input.name, fields.url || input.url)

  return fields
}

/*
|--------------------------------------------------------------------------
| CREATE Endpoint Monitor
|--------------------------------------------------------------------------
*/
exports.createMonitor = async (req, res) => {
  let fields
  try {
    fields = normalizeMonitorFields(req.body)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  try {
    const userId = req.user

    const monitorCount = await EndpointMonitor.countDocuments({ user: userId })
    const monitorLimit = getMaxMonitorsPerUser()
    if (monitorCount >= monitorLimit) {
      return res.status(409).json({
        error: `Monitor limit reached (${monitorLimit})`,
        code: "MONITOR_LIMIT_REACHED",
      })
    }

    const monitor = new EndpointMonitor({
      user: userId,
      ...fields,
      lastStatus: null,
      lastChecked: null
    })

    await monitor.save()

    try {
      await scheduleMonitor(monitor)
    } catch (error) {
      await monitor.deleteOne()
      try {
        await removeMonitorSchedule(monitor._id)
      } catch (cleanupError) {
        console.error("CreateMonitor schedule cleanup error:", cleanupError)
      }
      throw error
    }

    return res.status(201).json({
      message: "Endpoint created",
      endpoint: monitor
    })

  } catch (error) {
    console.error("CreateMonitor Error:", error)

    return res.status(500).json({
      error: "Server error"
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET All User Monitors
|--------------------------------------------------------------------------
*/
exports.getMonitors = async (req, res) => {
  try {
    const userId = req.user

    const monitors = await EndpointMonitor.find({
      user: userId
    }).sort({ createdAt: -1 })

    return res.json(monitors)

  } catch (error) {
    console.error("GetMonitors Error:", error)

    return res.status(500).json({
      error: "Server error"
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET Single Monitor
|--------------------------------------------------------------------------
*/
exports.getMonitorById = async (req, res) => {
  try {
    const userId = req.user
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid monitor id" })
    }

    const monitor = await EndpointMonitor.findById(id)

    if (!monitor) {
      return res.status(404).json({
        error: "Monitor not found"
      })
    }

    // Ownership security check
    if (monitor.user.toString() !== userId) {
      return res.status(403).json({
        error: "Forbidden"
      })
    }

    return res.json(monitor)

  } catch (error) {
    console.error("GetMonitorById Error:", error)

    return res.status(500).json({
      error: "Server error"
    })
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE Monitor
|--------------------------------------------------------------------------
*/
exports.updateMonitor = async (req, res) => {
  let fields
  try {
    fields = normalizeMonitorFields(req.body, { partial: true })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  try {
    const userId = req.user
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid monitor id" })
    }

    const monitor = await EndpointMonitor.findById(id)

    if (!monitor) {
      return res.status(404).json({
        error: "Monitor not found"
      })
    }

    if (monitor.user.toString() !== userId) {
      return res.status(403).json({
        error: "Forbidden"
      })
    }

    const previousFields = {
      name: monitor.name,
      url: monitor.url,
      method: monitor.method,
      expectedStatus: monitor.expectedStatus,
      interval: monitor.interval,
    }

    Object.assign(monitor, fields)
    await monitor.save()

    try {
      await scheduleMonitor(monitor)
    } catch (error) {
      Object.assign(monitor, previousFields)
      await monitor.save()
      try {
        await scheduleMonitor(monitor, { runImmediately: false })
      } catch (rollbackError) {
        console.error("UpdateMonitor schedule rollback error:", rollbackError)
      }
      throw error
    }

    return res.json({
      message: "Monitor updated",
      endpoint: monitor
    })

  } catch (error) {
    console.error("UpdateMonitor Error:", error)

    return res.status(500).json({
      error: "Server error"
    })
  }
}

/*
|--------------------------------------------------------------------------
| DELETE Monitor
|--------------------------------------------------------------------------
*/
exports.deleteMonitor = async (req, res) => {
  try {
    const userId = req.user
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid monitor id" })
    }

    const monitor = await EndpointMonitor.findById(id)

    if (!monitor) {
      return res.status(404).json({
        error: "Monitor not found"
      })
    }

    if (monitor.user.toString() !== userId) {
      return res.status(403).json({
        error: "Forbidden"
      })
    }

    await MonitoringLog.deleteMany({
      monitor: id
    })

    await monitor.deleteOne()

    try {
      await removeMonitorSchedule(id)
    } catch (scheduleError) {
      // A queued check for a deleted monitor is safe: the worker treats it as a no-op.
      console.error("DeleteMonitor schedule cleanup error:", scheduleError)
    }

    return res.json({
      message: "Monitor deleted"
    })

  } catch (error) {
    console.error("DeleteMonitor Error:", error)

    return res.status(500).json({
      error: "Server error"
    })
  }
}

exports.normalizeInterval = normalizeInterval
exports.normalizeMonitorFields = normalizeMonitorFields
exports.getMaxMonitorsPerUser = getMaxMonitorsPerUser
