const { randomUUID } = require("node:crypto")
const { Worker } = require("bullmq")
const IORedis = require("ioredis")
const EndpointMonitor = require("../models/EndpointMonitor")
const MonitoringLog = require("../models/MonitoringLog")
const testApiEndpoint = require("../services/apiTester")
const { getBullConnectionOptions } = require("../config/redis")
const {
  QUEUE_NAME,
  synchronizeMonitorSchedules,
} = require("../queues/monitorQueue")

const FAILURE_THRESHOLD = 3
const DEFAULT_WORKER_CONCURRENCY = 10
const DEFAULT_LOCK_TTL_MS = 25000

let worker
let lockConnection
let lastWorkerRun = null

const getWorkerConcurrency = () => {
  const configured = Number(process.env.WORKER_CONCURRENCY)
  return Number.isInteger(configured) && configured > 0 && configured <= 100
    ? configured
    : DEFAULT_WORKER_CONCURRENCY
}

const getLockTtlMs = () => {
  const configured = Number(process.env.MONITOR_LOCK_TTL_MS)
  return Number.isInteger(configured) && configured >= 15000
    ? configured
    : DEFAULT_LOCK_TTL_MS
}

const calculateMonitorState = ({ status, failureCount }, isSuccess) => {
  const nextFailureCount = isSuccess ? 0 : Number(failureCount || 0) + 1
  const nextStatus = isSuccess
    ? "UP"
    : nextFailureCount >= FAILURE_THRESHOLD
      ? "DOWN"
      : status

  return { nextFailureCount, nextStatus }
}

const getLockConnection = () => {
  if (!lockConnection) {
    lockConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
    lockConnection.on("error", (error) => {
      console.error("Monitor lock Redis error:", error.message)
    })
  }
  return lockConnection
}

const acquireMonitorLock = async (monitorId) => {
  const token = randomUUID()
  const key = `pulseguard:monitor-lock:${monitorId}`
  const result = await getLockConnection().set(
    key,
    token,
    "PX",
    getLockTtlMs(),
    "NX",
  )

  return result === "OK" ? { key, token } : null
}

const releaseMonitorLock = async (lock) => {
  if (!lock) return
  await getLockConnection().eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    1,
    lock.key,
    lock.token,
  )
}

const processMonitorCheck = async (monitorId) => {
  const lock = await acquireMonitorLock(monitorId)
  if (!lock) return { skipped: true, reason: "already-running" }

  try {
    const monitor = await EndpointMonitor.findById(monitorId)
    if (!monitor) return { skipped: true, reason: "monitor-not-found" }

    const result = await testApiEndpoint(monitor)
    const isSuccess = result.statusCode === monitor.expectedStatus
    const previousStatus = monitor.status
    const { nextFailureCount, nextStatus } = calculateMonitorState(monitor, isSuccess)

    if (previousStatus !== nextStatus) {
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
      success: isSuccess,
      message: String(result.message || "").slice(0, 500),
    })

    lastWorkerRun = new Date()
    return { success: isSuccess, statusCode: result.statusCode }
  } finally {
    try {
      await releaseMonitorLock(lock)
    } catch (error) {
      // Do not retry an already persisted check only because lock cleanup failed.
      console.error(`Unable to release monitor lock ${monitorId}:`, error.message)
    }
  }
}

const startMonitorWorker = async () => {
  const monitors = await EndpointMonitor.find().select("_id interval").lean()
  await synchronizeMonitorSchedules(monitors)

  worker = new Worker(
    QUEUE_NAME,
    job => processMonitorCheck(job.data.monitorId),
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

const closeMonitorWorker = async () => {
  if (worker) {
    await worker.close()
    worker = undefined
  }
  if (lockConnection) {
    await lockConnection.quit()
    lockConnection = undefined
  }
}

module.exports = {
  calculateMonitorState,
  closeMonitorWorker,
  getWorkerState: () => ({
    isRunning: Boolean(worker?.isRunning()),
    lastRun: lastWorkerRun,
  }),
  processMonitorCheck,
  startMonitorWorker,
}
