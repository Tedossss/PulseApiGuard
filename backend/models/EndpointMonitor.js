const mongoose = require("mongoose")

const EndpointMonitorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: String,
  url: String,

  status: { 
    type: String, 
    default: "PENDING",
    uppercase: true // щоб завжди зберігало "UP" або "DOWN"
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
    default: "GET"
  },

  expectedStatus: {
    type: Number,
    default: 200
  },

  interval: {
    type: Number,
    default: 60
  },

  lastStatus: Number,
  lastChecked: Date

}, { timestamps: true })

module.exports = mongoose.model(
  "EndpointMonitor",
  EndpointMonitorSchema
)