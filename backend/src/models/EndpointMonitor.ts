import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose"

export const MONITOR_STATUSES = ["PENDING", "UP", "DOWN"] as const
export const MONITOR_METHODS = ["GET", "HEAD"] as const

export type MonitorStatus = (typeof MONITOR_STATUSES)[number]
export type MonitorMethod = (typeof MONITOR_METHODS)[number]

const EndpointMonitorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true },
    status: {
      type: String,
      default: "PENDING",
      uppercase: true,
      enum: MONITOR_STATUSES,
    },
    failureCount: { type: Number, default: 0 },
    downSince: { type: Date, default: null },
    method: { type: String, default: "GET", enum: MONITOR_METHODS },
    expectedStatus: { type: Number, default: 200, min: 100, max: 599 },
    interval: { type: Number, default: 60, min: 30, max: 86400 },
    lastStatus: { type: Number, default: null },
    lastChecked: { type: Date, default: null },
  },
  { timestamps: true },
)

EndpointMonitorSchema.index({ user: 1, createdAt: -1 })
EndpointMonitorSchema.index({ user: 1, status: 1 })

export type EndpointMonitorFields = InferSchemaType<typeof EndpointMonitorSchema>
export type EndpointMonitorDocument = HydratedDocument<EndpointMonitorFields>

const EndpointMonitor = mongoose.model("EndpointMonitor", EndpointMonitorSchema)

export default EndpointMonitor
