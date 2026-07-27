const EndpointMonitor = require("../models/EndpointMonitor")
const MonitoringLog = require("../models/MonitoringLog")
const testApiEndpoint = require("../services/apiTester")

let isWorkerRunning = false

const checkEndpoints = async () => {
  if (isWorkerRunning) return

  isWorkerRunning = true

  try {
    const monitors = await EndpointMonitor.find()

    for (const monitor of monitors) {

      const now = Date.now()

      if (
        monitor.lastChecked &&
        now - new Date(monitor.lastChecked).getTime() <
        monitor.interval * 1000
      ) {
        continue
      }

      const result = await testApiEndpoint(monitor)

      monitor.lastStatus = result.statusCode
      monitor.lastChecked = new Date()

      await monitor.save()

      await MonitoringLog.create({
        monitor: monitor._id,
        ...result
      })

    }

  } catch (err) {
    console.error("Worker Error:", err)
  }

  isWorkerRunning = false
}

const { getWorkerState } = require("../workers/monitorWorker")

const worker = getWorkerState()

const startWorker = () => {
  setInterval(checkEndpoints, 30000)
}

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