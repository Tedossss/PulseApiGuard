const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  monitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EndpointMonitor",
    required: true,
  },
  statusCode: { type: Number, default: null },
  success: { type: Boolean, required: true },
  responseTime: { type: Number, min: 0, default: null },
  message: { type: String, maxlength: 500 },
}, { timestamps: true });

logSchema.index({ monitor: 1, createdAt: -1, _id: -1 });
logSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, name: "monitor_log_retention_30d" },
);

module.exports = mongoose.model("MonitoringLog", logSchema);
