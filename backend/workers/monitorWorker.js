const EndpointMonitor = require("../models/EndpointMonitor")
const MonitoringLog = require("../models/MonitoringLog")
const testApiEndpoint = require("../services/apiTester")

let isWorkerRunning = false
let lastWorkerRun = null

const FAILURE_THRESHOLD = 3
const WORKER_TICK_MS = 5000

const getMonitorIntervalMs = (monitor) => {
  const interval = Number(monitor.interval)
  return Number.isFinite(interval) && interval > 0
    ? interval * 1000
    : 60000
}

const checkEndpoints = async () => {
  if (isWorkerRunning) return

  isWorkerRunning = true
  lastWorkerRun = new Date()

  try {
    const monitors = await EndpointMonitor.find()

    for (const monitor of monitors) {

      const now = Date.now()

      if (
        monitor.lastChecked &&
        now - new Date(monitor.lastChecked).getTime() <
        getMonitorIntervalMs(monitor)
      ) {
        continue
      }

      const result = await testApiEndpoint(monitor)

      const isSuccess =
        result.statusCode === monitor.expectedStatus

      if (isSuccess) {
        monitor.failureCount = 0
      } else {
        monitor.failureCount += 1
      }

      let newState = monitor.status

      if (monitor.failureCount >= FAILURE_THRESHOLD) {
        newState = "DOWN"
      }

      if (isSuccess) {
        newState = "UP"
      }

      const previousState = monitor.status

      // 🔥 STATE TRANSITION LOGIC
      if (previousState !== newState) {

        console.log(
          `State changed for ${monitor.url}: ${previousState} → ${newState}`
        )

        // UP → DOWN
        if (previousState === "UP" && newState === "DOWN") {
          monitor.downSince = new Date()
        }

        // DOWN → UP
        if (previousState === "DOWN" && newState === "UP") {

          if (monitor.downSince) {

            const downtime =
              new Date().getTime() -
              new Date(monitor.downSince).getTime()

            console.log(
              `Downtime for ${monitor.url}: ${Math.floor(downtime / 1000)} seconds`
            )

            monitor.downSince = null
          }
        }
      }

      monitor.status = newState
      monitor.lastStatus = result.statusCode
      monitor.lastChecked = new Date()

      await monitor.save()

      await MonitoringLog.create({
        monitor: monitor._id,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        success: isSuccess,
        checkedAt: new Date()
      })
    }

  } catch (err) {
    console.error("Worker Error:", err)
  }

  isWorkerRunning = false
}

const startWorker = () => {
  checkEndpoints()
  setInterval(checkEndpoints, WORKER_TICK_MS)
}

module.exports = {
  startWorker,
  getWorkerState: () => ({
    isRunning: isWorkerRunning,
    lastRun: lastWorkerRun
  })
}
