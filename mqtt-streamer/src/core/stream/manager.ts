/**
 * Stream manager with improved error handling
 */

import { v4 as uuidv4 } from "uuid";
import axios, { AxiosError } from "axios";
import { createChildLogger } from "../../utils/logger";
import { StreamFormatter, QueuedMessage } from "./formatter";
import { DeviceConfig } from "../../types/common";

export interface StreamConfig {
  endpoint: string;
  headers: Record<string, string>;
  streaming: {
    enabled: boolean;
    rate: number;
  };
}

export interface StreamStats {
  messages_received: number;
  batches_sent: number;
  messages_sent: number;
  errors: number;
  last_batch_time: string | null;
  last_error: string | null;
  queue_size: number;
  status: "running" | "paused" | "stopped";
}

export class StreamManager {
  private readonly deviceId: string;
  private readonly routineId: string;
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;
  private readonly batchRate: number;
  private readonly deviceMetadata: Record<string, any>;
  private readonly streamLogger: ReturnType<typeof createChildLogger>;

  private readonly messageQueue: QueuedMessage[] = [];
  private status: "running" | "paused" | "stopped" = "running";
  private batchInterval: NodeJS.Timeout | null = null;
  private consecutiveErrors = 0;

  private stats: StreamStats = {
    messages_received: 0,
    batches_sent: 0,
    messages_sent: 0,
    errors: 0,
    last_batch_time: null,
    last_error: null,
    queue_size: 0,
    status: "running",
  };

  constructor(deviceConfig: DeviceConfig, streamConfig: StreamConfig) {
    this.deviceId = deviceConfig.device_id;
    this.routineId = uuidv4();
    this.endpoint = streamConfig.endpoint;
    this.headers = streamConfig.headers || {};
    this.batchRate = streamConfig.streaming?.rate || 5000;
    this.deviceMetadata = deviceConfig.metadata || {};

    this.streamLogger = createChildLogger("StreamManager", {
      device_id: this.deviceId,
      routine_id: this.routineId,
    });

    this.streamLogger.info("Stream manager initialized", {
      endpoint: this.endpoint,
      batch_rate_ms: this.batchRate,
    });

    this.startBatchProcessor();
  }

  pushMessage(topic: string, payload: string): boolean {
    if (this.status !== "running") {
      this.streamLogger.warn("Message rejected - not running", {
        topic,
        status: this.status,
      });
      return false;
    }

    try {
      let data: any;
      try {
        data = JSON.parse(payload);
      } catch {
        data = { value: payload };
      }

      const message: QueuedMessage = {
        topic,
        timestamp: data.timestamp || new Date().toISOString(),
        data,
      };

      this.messageQueue.push(message);
      this.stats.messages_received++;
      this.stats.queue_size = this.messageQueue.length;

      this.streamLogger.debug("Message queued", {
        topic,
        queue_size: this.messageQueue.length,
      });

      return true;
    } catch (error) {
      this.streamLogger.error("Failed to queue message", { topic, error });
      this.stats.errors++;
      this.stats.last_error =
        error instanceof Error ? error.message : "Unknown error";
      return false;
    }
  }

  private startBatchProcessor(): void {
    this.batchInterval = setInterval(() => {
      if (this.status === "running") {
        this.processBatch().catch((error) => {
          this.streamLogger.error("Batch processing error", { error });
        });
      }
    }, this.batchRate);

    this.streamLogger.info("Batch processor started", {
      interval_ms: this.batchRate,
    });
  }

  private async processBatch(): Promise<void> {
    if (this.messageQueue.length === 0) {
      return;
    }

    const messages = this.messageQueue.splice(0);
    this.stats.queue_size = 0;

    if (messages.length === 0) {
      return;
    }

    this.streamLogger.info("Processing batch", {
      message_count: messages.length,
    });

    try {
      const payload = StreamFormatter.formatBatch(
        this.deviceId,
        this.routineId,
        messages,
        this.deviceMetadata
      );

      const startTime = Date.now();
      const response = await axios.post(this.endpoint, payload, {
        headers: this.headers,
        timeout: 10000,
      });

      const duration = Date.now() - startTime;

      // Accept both 200 and 202 status codes
      if (response.status === 200 || response.status === 202) {
        this.stats.batches_sent++;
        this.stats.messages_sent += messages.length;
        this.stats.last_batch_time = new Date().toISOString();
        this.consecutiveErrors = 0;

        this.streamLogger.info("Batch sent successfully", {
          message_count: messages.length,
          response_time_ms: duration,
          status_code: response.status,
        });
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.handleBatchError(error, messages);
    }
  }

  private handleBatchError(error: unknown, messages: QueuedMessage[]): void {
    this.consecutiveErrors++;
    this.stats.errors++;

    const errorMessage =
      error instanceof AxiosError
        ? `HTTP ${error.response?.status}: ${error.message}`
        : error instanceof Error
        ? error.message
        : "Unknown error";

    this.stats.last_error = errorMessage;

    this.streamLogger.error("Failed to send batch", {
      message_count: messages.length,
      error: errorMessage,
      consecutive_errors: this.consecutiveErrors,
    });

    if (this.consecutiveErrors > 3) {
      const backoffDelay = Math.min(
        30000,
        this.batchRate * Math.pow(2, this.consecutiveErrors - 3)
      );
      this.streamLogger.warn("Applying backoff delay", {
        delay_ms: backoffDelay,
        consecutive_errors: this.consecutiveErrors,
      });

      setTimeout(() => {
        this.messageQueue.unshift(...messages);
        this.stats.queue_size = this.messageQueue.length;
      }, backoffDelay);
    } else {
      this.messageQueue.unshift(...messages);
      this.stats.queue_size = this.messageQueue.length;
    }
  }

  pause(): void {
    this.status = "paused";
    this.stats.status = "paused";
    this.streamLogger.info("Stream paused");
  }

  resume(): void {
    this.status = "running";
    this.stats.status = "running";
    this.streamLogger.info("Stream resumed");
  }

  stop(): void {
    this.status = "stopped";
    this.stats.status = "stopped";

    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }

    this.streamLogger.info("Stream stopped");
  }

  getStats(): StreamStats {
    return { ...this.stats };
  }

  getStatus(): "running" | "paused" | "stopped" {
    return this.status;
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clearQueue(): number {
    const clearedCount = this.messageQueue.length;
    this.messageQueue.length = 0;
    this.stats.queue_size = 0;

    this.streamLogger.info("Queue cleared", {
      cleared_messages: clearedCount,
    });

    return clearedCount;
  }
}
