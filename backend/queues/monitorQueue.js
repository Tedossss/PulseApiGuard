const { Queue } = require("bullmq")
const { getBullConnectionOptions } = require("../config/redis")

const QUEUE_NAME = "monitor-checks"
const SCHEDULER_PREFIX = "monitor-"

let monitorQueue

const getMonitorQueue = () => {
  if (!monitorQueue) {
    monitorQueue = new Queue(QUEUE_NAME, {
      connection: getBullConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400, count: 5000 },
      },
    })
  }

  return monitorQueue
}

const schedulerIdFor = (monitorId) => `${SCHEDULER_PREFIX}${monitorId}`

const getIntervalMs = (monitor) => {
  const seconds = Number(monitor.interval)
  const safeSeconds = Number.isFinite(seconds)
    ? Math.min(86400, Math.max(30, Math.round(seconds)))
    : 60
  return safeSeconds * 1000
}

const scheduleMonitor = async (monitor, { runImmediately = true } = {}) => {
  const queue = getMonitorQueue()
  const monitorId = monitor._id.toString()

  await queue.upsertJobScheduler(
    schedulerIdFor(monitorId),
    { every: getIntervalMs(monitor) },
    {
      name: "check-monitor",
      data: { monitorId },
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400, count: 5000 },
      },
    },
  )

  if (runImmediately) {
    const windowId = Math.floor(Date.now() / 30000)
    await queue.add("check-monitor", { monitorId }, {
      jobId: `initial-${monitorId}-${windowId}`,
    })
  }
}

const removeMonitorSchedule = async (monitorId) => {
  return getMonitorQueue().removeJobScheduler(schedulerIdFor(monitorId.toString()))
}

const synchronizeMonitorSchedules = async (monitors) => {
  const queue = getMonitorQueue()
  const activeSchedulerIds = new Set()

  for (const monitor of monitors) {
    const schedulerId = schedulerIdFor(monitor._id.toString())
    activeSchedulerIds.add(schedulerId)
    await scheduleMonitor(monitor)
  }

  const schedulers = await queue.getJobSchedulers(0, -1, true)
  for (const scheduler of schedulers) {
    if (scheduler.id?.startsWith(SCHEDULER_PREFIX) && !activeSchedulerIds.has(scheduler.id)) {
      await queue.removeJobScheduler(scheduler.id)
    }
  }
}

const closeMonitorQueue = async () => {
  if (monitorQueue) {
    await monitorQueue.close()
    monitorQueue = undefined
  }
}

module.exports = {
  QUEUE_NAME,
  closeMonitorQueue,
  getIntervalMs,
  getMonitorQueue,
  removeMonitorSchedule,
  scheduleMonitor,
  schedulerIdFor,
  synchronizeMonitorSchedules,
}
