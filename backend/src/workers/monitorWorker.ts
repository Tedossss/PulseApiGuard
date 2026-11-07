import { randomUUID } from "node:crypto"
import { Worker } from "bullmq"
import type IORedis from "ioredis"
import { createRedisConnection, getBullConnectionOptions } from "../config/redis"
import EndpointMonitor, { type MonitorStatus } from "../models/EndpointMonitor"
import MonitoringLog from "../models/MonitoringLog"
import {
  QUEUE_NAME,
  synchronizeMonitorSchedules,
  type MonitorJobData,
} from "../queues/monitorQueue"
import testApiEndpoint from "../services/apiTester"
import { sendTelegramMonitorAlert, type MonitorAlert } from "../services/telegramBot"
import { errorMessage } from "../utils/errors"

const FAILURE_THRESHOLD = 3
const DEFAULT_WORKER_CONCURRENCY = 10
const DEFAULT_LOCK_TTL_MS = 25000
const RELEASE_LOCK_SCRIPT =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"

interface MonitorLock {
  key: string
  token: string
}

type CheckOutcome =
  | { skipped: true; reason: "already-running" | "monitor-not-found" }
  | { skipped?: false; success: boolean; statusCode: number | null }

let worker: Worker<MonitorJobData, CheckOutcome> | undefined
let lockConnection: IORedis | undefined
let lastWorkerRun: Date | null = null

const getWorkerConcurrency = () => {
  const configured = Number(process.env.WORKER_CONCURRENCY)
  return Number.isInteger(configured) && configured > 0 && configured <= 100
    ? configured
    : DEFAULT_WORKER_CONCURRENCY
}

const getLockTtlMs = () => {
  const configured = Number(process.env.MONITOR_LOCK_TTL_MS)
  return Number.isInteger(configured) && configured >= 15000 ? configured : DEFAULT_LOCK_TTL_MS
}

export const calculateMonitorState = (
  { status, failureCount }: { status?: string | null; failureCount?: number | null },
  isSuccess: boolean,
) => {
  const nextFailureCount = isSuccess ? 0 : Number(failureCount || 0) + 1
  const nextStatus = (
    isSuccess ? "UP" : nextFailureCount >= FAILURE_THRESHOLD ? "DOWN" : status
  ) as MonitorStatus

  return { nextFailureCount, nextStatus }
}

export const shouldSendStatusAlert = (
  previousStatus: string | null | undefined,
  nextStatus: string,
) => nextStatus === "DOWN" || (previousStatus === "DOWN" && nextStatus === "UP")

const getLockConnection = () => {
  lockConnection ??= createRedisConnection("Monitor lock")
  return lockConnection
}

const acquireMonitorLock = async (monitorId: string): Promise<MonitorLock | null> => {
  const token = randomUUID()
  const key = `pulseguard:monitor-lock:${monitorId}`
  const result = await getLockConnection().set(key, token, "PX", getLockTtlMs(), "NX")
  return result === "OK" ? { key, token } : null
}

const releaseMonitorLock = async (lock: MonitorLock) => {
  await getLockConnection().eval(RELEASE_LOCK_SCRIPT, 1, lock.key, lock.token)
}

export const processMonitorCheck = async (monitorId: string): Promise<CheckOutcome> => {
  const lock = await acquireMonitorLock(monitorId)
  if (!lock) return { skipped: true, reason: "already-running" }

  let alertPayload: MonitorAlert | undefined
  let outcome: CheckOutcome
  try {
    const monitor = await EndpointMonitor.findById(monitorId)
    if (!monitor) return { skipped: true, reason: "monitor-not-found" }

    const result = await testApiEndpoint(monitor)
    const previousStatus = monitor.status
    const previousDownSince = monitor.downSince
    const { nextFailureCount, nextStatus } = calculateMonitorState(monitor, result.success)

    const statusChanged = previousStatus !== nextStatus
    if (statusChanged) {
      console.log(`State changed for ${monitor.url}: ${previousStatus} -> ${nextStatus}`)
      if (nextStatus === "DOWN") monitor.downSince = new Date()
      if (previousStatus === "DOWN" && nextStatus === "UP") monitor.downSince = null
    }

    monitor.failureCount = nextFailureCount
    monitor.status = nextStatus
    monitor.lastStatus = result.statusCode
    monitor.lastChecked = new Date()

    await monitor.save()
    await MonitoringLog.create({
      monitor: monitor._id,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      success: result.success,
      message: String(result.message || "").slice(0, 500),
    })

    if (statusChanged && shouldSendStatusAlert(previousStatus, nextStatus)) {
      alertPayload = {
        monitor,
        nextStatus,
        result,
        changedAt: monitor.lastChecked,
        downSince: previousDownSince,
      }
    }

    lastWorkerRun = new Date()
    outcome = { success: result.success, statusCode: result.statusCode }
  } finally {
    try {
      await releaseMonitorLock(lock)
    } catch (error) {
      // Do not retry an already persisted check only because lock cleanup failed.
      console.error(`Unable to release monitor lock ${monitorId}:`, errorMessage(error))
    }
  }

  if (alertPayload) await sendTelegramMonitorAlert(alertPayload)
  return outcome
}

export const startMonitorWorker = async () => {
  const monitors = await EndpointMonitor.find().select("_id interval").lean()
  await synchronizeMonitorSchedules(monitors)

  worker = new Worker<MonitorJobData, CheckOutcome>(
    QUEUE_NAME,
    (job) => processMonitorCheck(job.data.monitorId),
    {
      connection: getBullConnectionOptions({ worker: true }),
      concurrency: getWorkerConcurrency(),
    },
  )

  worker.on("completed", (job, result) => {
    if (!result?.skipped) console.log(`Monitor job ${job.id} completed`)
  })
  worker.on("failed", (job, error) => {
    console.error(`Monitor job ${job?.id || "unknown"} failed:`, error.message)
  })
  worker.on("error", (error) => {
    console.error("Monitor worker error:", error)
  })

  console.log(`Monitor worker started with concurrency ${getWorkerConcurrency()}`)
  return worker
}

export const closeMonitorWorker = async () => {
  if (worker) {
    await worker.close()
    worker = undefined
  }
  if (lockConnection) {
    await lockConnection.quit()
    lockConnection = undefined
  }
}

export const getWorkerState = () => ({
  isRunning: Boolean(worker?.isRunning()),
  lastRun: lastWorkerRun,
})
