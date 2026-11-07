const mongoose = require("mongoose")

const EndpointMonitorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: { type: String, required: true, trim: true, maxlength: 120 },
  url: { type: String, required: true },

  status: { 
    type: String,
    default: "PENDING",
    uppercase: true,
    enum: ["PENDING", "UP", "DOWN"]
  },

failureCount: {
  type: Number,
  default: 0
},

downSince: {
  type: Date,
  default: null
},

  method: {
    type: String,
    default: "GET",
    enum: ["GET", "HEAD"]
  },

  expectedStatus: {
    type: Number,
    default: 200,
    min: 100,
    max: 599
  },

  interval: {
    type: Number,
    default: 60,
    min: 30,
    max: 86400
  },

  lastStatus: Number,
  lastChecked: Date

}, { timestamps: true })

EndpointMonitorSchema.index({ user: 1, createdAt: -1 })
EndpointMonitorSchema.index({ user: 1, status: 1 })

module.exports = mongoose.model(
  "EndpointMonitor",
  EndpointMonitorSchema
)
