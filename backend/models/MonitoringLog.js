const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  monitor: { type: mongoose.Schema.Types.ObjectId, ref: "EndpointMonitor" },
  statusCode: Number,
  success: Boolean,
  responseTime: Number,
  message: String
}, { timestamps: true });

module.exports = mongoose.model("MonitoringLog", logSchema);
