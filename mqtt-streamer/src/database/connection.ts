/**
 * MongoDB connection manager for MQTT Streamer
 */

import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { MONGO_URI } from "../config/env";

const options: mongoose.ConnectOptions = {
  maxPoolSize: 8,
  minPoolSize: 2,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  serverSelectionTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  bufferCommands: false,
  autoIndex: false,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
};

let isConnected = false;
let isConnecting = false;

/**
 * Connect to MongoDB with retry logic
 */
export const connectWithRetry = async (retries = 3): Promise<void> => {
  if (isConnected || isConnecting) return;
  isConnecting = true;

  let attemptCount = 0;
  while (attemptCount < retries) {
    try {
      logger.info(`MongoDB connection attempt ${attemptCount + 1}/${retries}`);

      await mongoose.connect(MONGO_URI, options);

      isConnected = true;
      isConnecting = false;

      logger.info("✅ MongoDB connected successfully");
      return;
    } catch (err: any) {
      attemptCount++;
      logger.warn(
        `MongoDB connection attempt ${attemptCount} failed: ${err.message}`
      );

      if (attemptCount >= retries) {
        isConnecting = false;
        throw err;
      }

      const delay = Math.min(1000 * Math.pow(2, attemptCount), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Check if MongoDB is connected
 */
export const isMongoConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Wait for MongoDB connection
 */
export const waitForConnection = async (timeoutMs = 60000): Promise<void> => {
  const startTime = Date.now();

  while (!isMongoConnected() && Date.now() - startTime < timeoutMs) {
    if (!isConnecting) {
      await connectWithRetry();
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!isMongoConnected()) {
    throw new Error(`MongoDB connection timeout after ${timeoutMs}ms`);
  }
};

/**
 * Disconnect from MongoDB gracefully
 */
export const disconnect = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info("MongoDB connection closed gracefully");
  } catch (err: any) {
    logger.error("Error closing MongoDB connection:", err);
    throw err;
  }
};

// Event handlers
mongoose.connection.on("error", (err) => {
  isConnected = false;
  logger.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB disconnected - attempting reconnection");

  if (!isConnecting) {
    setTimeout(() => connectWithRetry(2), 5000);
  }
});

mongoose.connection.on("connected", () => {
  isConnected = true;
  logger.info("MongoDB connection established");
});

export default {
  connection: mongoose.connection,
  connectWithRetry,
  isMongoConnected,
  waitForConnection,
  disconnect,
};
