require("dotenv").config();
const mongoose = require("mongoose");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async ({
  retry = true,
  retryDelayMs = 5000,
} = {}) => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not defined. Server will start without DB.");
    return false;
  }

  // Avoid reconnect loops if already connected/connecting
  if (mongoose.connection.readyState === 1) return true; // connected
  if (mongoose.connection.readyState === 2) return false; // connecting

  while (true) {
    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      return true;
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
      if (!retry) return false;
      await sleep(retryDelayMs);
    }
  }
};

module.exports = connectDB;
