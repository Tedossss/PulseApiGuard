import { Queue, type JobsOptions } from "bullmq"
import type { Types } from "mongoose"
import { getBullConnectionOptions } from "../config/redis"

export const QUEUE_NAME = "monitor-checks"
const SCHEDULER_PREFIX = "monitor-"

export interface MonitorJobData {
  monitorId: string
}

export interface SchedulableMonitor {
  _id: Types.ObjectId | string
  interval?: number | null
}

const JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400, count: 5000 },
}

let monitorQueue: Queue<MonitorJobData> | undefined

export const getMonitorQueue = () => {
  monitorQueue ??= new Queue<MonitorJobData>(QUEUE_NAME, {
    connection: getBullConnectionOptions(),
    defaultJobOptions: JOB_OPTIONS,
  })
  return monitorQueue
}

export const schedulerIdFor = (monitorId: Types.ObjectId | string) =>
  `${SCHEDULER_PREFIX}${monitorId.toString()}`

export const getIntervalMs = (monitor: Pick<SchedulableMonitor, "interval">) => {
  const seconds = Number(monitor.interval)
  const safeSeconds = Number.isFinite(seconds)
    ? Math.min(86400, Math.max(30, Math.round(seconds)))
    : 60
  return safeSeconds * 1000
}

export const scheduleMonitor = async (
  monitor: SchedulableMonitor,
  { runImmediately = true } = {},
) => {
  const queue = getMonitorQueue()
  const monitorId = monitor._id.toString()

  await queue.upsertJobScheduler(
    schedulerIdFor(monitorId),
    { every: getIntervalMs(monitor) },
    { name: "check-monitor", data: { monitorId }, opts: JOB_OPTIONS },
  )

  if (runImmediately) {
    const windowId = Math.floor(Date.now() / 30000)
    await queue.add("check-monitor", { monitorId }, { jobId: `initial-${monitorId}-${windowId}` })
  }
}

export const removeMonitorSchedule = (monitorId: Types.ObjectId | string) =>
  getMonitorQueue().removeJobScheduler(schedulerIdFor(monitorId))

export const synchronizeMonitorSchedules = async (monitors: SchedulableMonitor[]) => {
  const queue = getMonitorQueue()
  const activeSchedulerIds = new Set<string>()

  for (const monitor of monitors) {
    activeSchedulerIds.add(schedulerIdFor(monitor._id))
    await scheduleMonitor(monitor)
  }

  const schedulers = await queue.getJobSchedulers(0, -1, true)
  for (const scheduler of schedulers) {
    const id = scheduler.id ?? scheduler.key
    if (id?.startsWith(SCHEDULER_PREFIX) && !activeSchedulerIds.has(id)) {
      await queue.removeJobScheduler(id)
    }
  }
}

export const closeMonitorQueue = async () => {
  if (monitorQueue) {
    await monitorQueue.close()
    monitorQueue = undefined
  }
}
