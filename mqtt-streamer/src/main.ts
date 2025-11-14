/**
 * Main application entry point
 */

import { loadConfig, validateConfigCompatibility } from "./config";
import { logger, logServiceStartup, logServiceShutdown, logPerformance } from "./utils/logger";
import { uptimeTracker } from "./utils/uptime";
import { MultiDeviceMQTTClient } from "./core/mqtt/manager";
import { StreamManager } from "./core/stream/manager";
import { CommandHandler } from "./core/command/handler";
import { createServer } from "./api/server";

class MQTTStreamerApp {
  private mqttManager: MultiDeviceMQTTClient | null = null;
  private readonly streamManagers: Map<string, StreamManager> = new Map();
  private commandHandler: CommandHandler | null = null;
  private server: any = null;
  private dataProcessingActive: boolean = false;
  
  // Performance metrics
  private performanceMetrics = {
    totalMessages: 0,
    totalProcessingTime: 0,
    lastMetricsLog: Date.now()
  };

  async start(): Promise<void> {
    try {
      logger.info("Starting MQTT Streamer application");

      // Load configuration (now async - supports both YAML and MongoDB)
      const config = await loadConfig();
      validateConfigCompatibility(config.app);

      // Start uptime tracking
      uptimeTracker.startHealthChecks();

      // Initialize MQTT manager with health monitoring (using default config)
      this.mqttManager = new MultiDeviceMQTTClient(
        config.app.mqtt.endpoint, 
        config.app.mqtt.port, 
        config.certs
      );

      // Initialize stream managers for each device
      for (const device of config.app.devices) {
        const streamManager = new StreamManager(
          device,
          config.app.stream.parameters
        );
        this.streamManagers.set(device.device_id, streamManager);
      }

      // Initialize command handler
      this.commandHandler = new CommandHandler(this.mqttManager);

      this.mqttManager.addMessageHandler((deviceId, topic, payload) => {
        // Only process messages after cooldown period
        if (!this.dataProcessingActive) {
          return;
        }
        
        const streamManager = this.streamManagers.get(deviceId);
        if (streamManager) {
          const deviceConfig = this.mqttManager!.getDeviceConfig(deviceId);
          if (deviceConfig && this.shouldProcessMessageForDevice(topic, deviceConfig)) {
            streamManager.pushMessage(topic, payload);
          }
        } else {
          logger.warn("No stream manager found for device", { deviceId, topic });
        }
      });

      // Initialize MQTT connections
      await this.mqttManager.initialize(config.app.devices);

      // Wait 10 seconds after all subscriptions complete before starting data processing
      logger.info("All devices subscribed successfully, starting 10-second cooldown before data processing");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Activate data processing
      this.dataProcessingActive = true;
      logger.info("Cooldown complete, data processing and streaming now active");

      // Create and start HTTP server
      this.server = createServer({
        mqttManager: this.mqttManager,
        streamManagers: this.streamManagers,
        commandHandler: this.commandHandler,
      });

      const port = config.env.PORT;
      this.server.listen(port, () => {
        logServiceStartup(port, config.env.NODE_ENV);
        logger.info("MQTT Streamer is ready", {
          port,
          devices: config.app.devices.length,
          mqtt_endpoint: config.app.mqtt.endpoint,
        });
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error("Failed to start application", { error });
      process.exit(1);
    }
  }



  private shouldProcessMessageForDevice(topic: string, deviceConfig: any): boolean {
    const startTime = Date.now();
    this.performanceMetrics.totalMessages++;
    
    let result = false;
    
    switch (deviceConfig.topics.mode) {
      case "selected":
        result = deviceConfig.topics.list.includes(topic);
        break;
      
      case "all":
        result = true;
        break;
      
      case "data_all":
        result = true;
        break;
      
      default:
        result = false;
    }
    
    const processingTime = Date.now() - startTime;
    this.performanceMetrics.totalProcessingTime += processingTime;
    
    // Log performance metrics every 1000 messages
    if (this.performanceMetrics.totalMessages % 1000 === 0) {
      this.logPerformanceMetrics();
    }
    
    return result;
  }

  /**
   * Log comprehensive performance metrics
   */
  private logPerformanceMetrics(): void {
    const now = Date.now();
    const timeSinceLastLog = now - this.performanceMetrics.lastMetricsLog;
    const avgProcessingTime = this.performanceMetrics.totalProcessingTime / this.performanceMetrics.totalMessages;
    
    logPerformance("Message Processing Batch", this.performanceMetrics.lastMetricsLog, {
      total_messages: this.performanceMetrics.totalMessages,
      avg_processing_time_ms: Math.round(avgProcessingTime * 1000) / 1000,
      messages_per_second: Math.round((1000 * 1000) / timeSinceLastLog)
    });
    
    this.performanceMetrics.lastMetricsLog = now;
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logServiceShutdown(signal);

      try {
        // Stop HTTP server
        if (this.server) {
          await new Promise<void>((resolve) => {
            this.server.close(() => resolve());
          });
        }

        // Stop stream managers
        for (const streamManager of this.streamManagers.values()) {
          streamManager.stop();
        }

        // Stop MQTT manager
        if (this.mqttManager) {
          await this.mqttManager.disconnect();
        }

        // Stop uptime tracking
        uptimeTracker.stopHealthChecks();

        logger.info("Application shutdown completed");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", { error });
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGQUIT", () => shutdown("SIGQUIT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", { error });
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled rejection", { reason, promise });
      shutdown("unhandledRejection");
    });
  }
}

// Start the application
const app = new MQTTStreamerApp();
app.start().catch((error) => {
  console.error("Failed to start application", error);
  process.exit(1);
});
