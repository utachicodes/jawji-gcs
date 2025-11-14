/**
 * Express server setup and configuration
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { uptimeTracker } from "../utils/uptime";
import { errorHandler } from "./middleware/error";
import { requestLogger } from "./middleware/logging";
import { statusRoutes } from "./routes/status";
import { controlRoutes } from "./routes/control";
import { commandRoutes } from "./routes/command";
import { healthRoutes } from "./routes/health";
import { MultiDeviceMQTTClient } from "../core/mqtt/manager";
import { StreamManager } from "../core/stream/manager";
import { CommandHandler } from "../core/command/handler";

export interface AppDependencies {
  mqttManager: MultiDeviceMQTTClient;
  streamManagers: Map<string, StreamManager>;
  commandHandler: CommandHandler;
}

export function createServer(
  dependencies: AppDependencies
): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint (before other routes)
  app.get("/health", (_req, res) => {
    const connectionSummary = dependencies.mqttManager.getStats();
    const systemHealth = uptimeTracker.getSystemHealth();

    const healthy = connectionSummary.connectedConnections === connectionSummary.totalConnections;

    res.status(healthy ? 200 : 503).json({
      healthy,
      services: {
        mqtt: connectionSummary.connectedConnections > 0,
        stream: Array.from(dependencies.streamManagers.values()).some(
          (sm) => sm.getStatus() === "running"
        ),
        api: true,
      },
      mqtt_connections: connectionSummary,
      system: systemHealth,
      timestamp: new Date().toISOString(),
    });
  });

  // Root endpoint
  app.get("/", (_req, res) => {
    res.json({
      service: "MQTT Streamer",
      version: "1.0.0",
      status: "running",
      uptime: uptimeTracker.getUptimeString(),
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use("/status", statusRoutes(dependencies));
  app.use("/control", controlRoutes(dependencies));
  app.use("/command", commandRoutes(dependencies));
  app.use("/device-health", healthRoutes(dependencies));

  // Shutdown endpoint - triggers graceful shutdown for config reload
  app.post("/shutdown", async (_req, res) => {
    try {
      res.status(202).json({
        message: "Shutdown initiated. Server will restart to load new configuration.",
        timestamp: new Date().toISOString(),
      });

      // Allow response to be sent before shutdown
      setTimeout(async () => {
        console.log("Graceful shutdown initiated via API...");
        
        // Disconnect all MQTT connections
        await dependencies.mqttManager.disconnect();
        
        // Stop all stream managers
        for (const streamManager of dependencies.streamManagers.values()) {
          streamManager.stop();
        }

        console.log("All services stopped. Exiting process...");
        
        // Exit process - Kubernetes will restart the pod
        process.exit(0);
      }, 1000);
    } catch (error) {
      console.error("Error during shutdown:", error);
      res.status(500).json({
        error: "Shutdown failed",
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
