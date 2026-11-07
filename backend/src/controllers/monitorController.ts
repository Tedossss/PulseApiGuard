import type { Request, Response } from "express"
import mongoose from "mongoose"
import { requireUserId } from "../middleware/auth"
import EndpointMonitor, { type MonitorMethod } from "../models/EndpointMonitor"
import MonitoringLog from "../models/MonitoringLog"
import { removeMonitorSchedule, scheduleMonitor } from "../queues/monitorQueue"
import { normalizeMethod, normalizeTargetUrl } from "../services/apiTester"
import { errorMessage, sendError } from "../utils/errors"

const DEFAULT_INTERVAL_SECONDS = 60
const MIN_INTERVAL_SECONDS = 30
const MAX_INTERVAL_SECONDS = 86400
const DEFAULT_MAX_MONITORS_PER_USER = 20

export interface MonitorFields {
  url: string
  method: MonitorMethod
  expectedStatus: number
  interval: number
  name: string
}

export const getMaxMonitorsPerUser = () => {
  const configured = Number(process.env.MAX_MONITORS_PER_USER)
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_MONITORS_PER_USER
}

export const normalizeInterval = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_INTERVAL_SECONDS
  }

  const interval = Number(value)
  if (
    !Number.isInteger(interval) ||
    interval < MIN_INTERVAL_SECONDS ||
    interval > MAX_INTERVAL_SECONDS
  ) {
    throw new Error(
      `Interval must be an integer from ${MIN_INTERVAL_SECONDS} to ${MAX_INTERVAL_SECONDS} seconds`,
    )
  }
  return interval
}

const normalizeExpectedStatus = (value: unknown) => {
  const status = Number(value ?? 200)
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new Error("Expected status must be an integer from 100 to 599")
  }
  return status
}

const normalizeName = (value: unknown, fallback: unknown) => {
  const name = String(value || fallback || "").trim()
  if (!name || name.length > 120) {
    throw new Error("Monitor name must contain 1 to 120 characters")
  }
  return name
}

export function normalizeMonitorFields(input: unknown): MonitorFields
export function normalizeMonitorFields(
  input: unknown,
  options: { partial: true },
): Partial<MonitorFields>
export function normalizeMonitorFields(
  input: unknown,
  { partial = false }: { partial?: boolean } = {},
): Partial<MonitorFields> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Request body must be a JSON object")
  }

  const body = input as Record<string, unknown>
  const fields: Partial<MonitorFields> = {}
  const includes = (key: keyof MonitorFields) => !partial || body[key] !== undefined

  if (includes("url")) fields.url = normalizeTargetUrl(body.url)
  if (includes("method")) fields.method = normalizeMethod(body.method)
  if (includes("expectedStatus"))
    fields.expectedStatus = normalizeExpectedStatus(body.expectedStatus)
  if (includes("interval")) fields.interval = normalizeInterval(body.interval)
  if (includes("name")) fields.name = normalizeName(body.name, fields.url || body.url)

  return fields
}

/** Loads a monitor and enforces ownership, sending the error response itself when it fails. */
const findOwnedMonitor = async (req: Request, res: Response) => {
  const userId = requireUserId(req)
  const id = String(req.params.id)

  if (!mongoose.isValidObjectId(id)) {
    sendError(res, 400, "Invalid monitor id")
    return null
  }

  const monitor = await EndpointMonitor.findById(id)
  if (!monitor) {
    sendError(res, 404, "Monitor not found")
    return null
  }

  if (monitor.user.toString() !== userId) {
    sendError(res, 403, "Forbidden")
    return null
  }

  return monitor
}

export const createMonitor = async (req: Request, res: Response) => {
  let fields: MonitorFields
  try {
    fields = normalizeMonitorFields(req.body)
  } catch (error) {
    return sendError(res, 400, errorMessage(error))
  }

  try {
    const userId = requireUserId(req)
    const monitorLimit = getMaxMonitorsPerUser()
    const limitReached = () =>
      sendError(res, 409, `Monitor limit reached (${monitorLimit})`, "MONITOR_LIMIT_REACHED")

    if ((await EndpointMonitor.countDocuments({ user: userId })) >= monitorLimit) {
      return limitReached()
    }

    const monitor = await EndpointMonitor.create({
      user: userId,
      ...fields,
      lastStatus: null,
      lastChecked: null,
    })

    // Concurrent requests can all pass the count above. ObjectIds grow with creation time,
    // so the monitors created after the limit was reached see themselves over it and back out.
    const position = await EndpointMonitor.countDocuments({
      user: userId,
      _id: { $lte: monitor._id },
    })
    if (position > monitorLimit) {
      await monitor.deleteOne()
      return limitReached()
    }

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

    return res.status(201).json({ message: "Endpoint created", endpoint: monitor })
  } catch (error) {
    console.error("CreateMonitor Error:", error)
    return sendError(res, 500, "Server error")
  }
}

export const getMonitors = async (req: Request, res: Response) => {
  try {
    const monitors = await EndpointMonitor.find({ user: requireUserId(req) }).sort({
      createdAt: -1,
    })
    return res.json(monitors)
  } catch (error) {
    console.error("GetMonitors Error:", error)
    return sendError(res, 500, "Server error")
  }
}

export const getMonitorById = async (req: Request, res: Response) => {
  try {
    const monitor = await findOwnedMonitor(req, res)
    if (!monitor) return
    return res.json(monitor)
  } catch (error) {
    console.error("GetMonitorById Error:", error)
    return sendError(res, 500, "Server error")
  }
}

export const updateMonitor = async (req: Request, res: Response) => {
  let fields: Partial<MonitorFields>
  try {
    fields = normalizeMonitorFields(req.body, { partial: true })
  } catch (error) {
    return sendError(res, 400, errorMessage(error))
  }

  try {
    const monitor = await findOwnedMonitor(req, res)
    if (!monitor) return

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

    return res.json({ message: "Monitor updated", endpoint: monitor })
  } catch (error) {
    console.error("UpdateMonitor Error:", error)
    return sendError(res, 500, "Server error")
  }
}

export const deleteMonitor = async (req: Request, res: Response) => {
  try {
    const monitor = await findOwnedMonitor(req, res)
    if (!monitor) return

    // Delete the monitor first: if a later step fails, the user no longer sees it,
    // a queued check becomes a no-op and leftover logs expire through their TTL index.
    await monitor.deleteOne()

    try {
      await removeMonitorSchedule(monitor._id)
    } catch (scheduleError) {
      console.error("DeleteMonitor schedule cleanup error:", scheduleError)
    }

    await MonitoringLog.deleteMany({ monitor: monitor._id })

    return res.json({ message: "Monitor deleted" })
  } catch (error) {
    console.error("DeleteMonitor Error:", error)
    return sendError(res, 500, "Server error")
  }
}
