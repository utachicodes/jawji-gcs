/**
 * Data formatting utilities for stream processing
 */

import { logger } from "../../utils/logger";

export interface QueuedMessage {
  topic: string;
  timestamp: string;
  data: any;
}

export interface ProcessedTopicData {
  topic: string;
  timestamp: string;
  data: {
    type: string;
    data: any;
  };
}

export interface StreamBatchPayload {
  timestamp: string;
  platformDeviceId: string;
  routineId: string;
  data: ProcessedTopicData[];
  metadata?: Record<string, any>;
}

export class StreamFormatter {
  /**
   * Format timestamp to ISO 8601 format
   */
  static formatTimestamp(timestamp?: string | Date): string {
    try {
      if (!timestamp) {
        return new Date().toISOString();
      }

      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }

      return new Date().toISOString();
    } catch (error) {
      logger.warn("Error formatting timestamp, using current time", {
        timestamp,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return new Date().toISOString();
    }
  }

  /**
   * Convert value to number if possible
   */
  static convertToNumber(value: any): number | string {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (/^-?\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10);
      }

      if (/^-?\d*\.\d+$/.test(trimmed)) {
        return parseFloat(trimmed);
      }

      if (/^-?\d*\.?\d+e[+-]?\d+$/i.test(trimmed)) {
        return parseFloat(trimmed);
      }
    }

    return value;
  }

  /**
   * Extract value from raw MQTT message data
   */
  static extractValue(rawData: any): any {
    if (rawData === null || rawData === undefined) {
      return 0;
    }

    if (typeof rawData !== "object") {
      return this.convertToNumber(rawData);
    }

    const valueFields = ["value", "data", "payload", "val"];

    for (const field of valueFields) {
      if (rawData[field] !== undefined) {
        return this.convertToNumber(rawData[field]);
      }
    }

    return typeof rawData === "object" ? rawData : 0;
  }

  /**
   * Format a single topic data point
   */
  static formatTopicData(
    topic: string,
    rawData: any,
    timestamp?: string
  ): ProcessedTopicData {
    const formattedTimestamp = this.formatTimestamp(timestamp);
    const value = this.extractValue(rawData);

    return {
      topic,
      timestamp: formattedTimestamp,
      data: {
        type: rawData?.type || "IoTValue",
        data: value,
      },
    };
  }

  /**
   * Format a batch of messages into a complete payload
   */
  static formatBatch(
    deviceId: string,
    routineId: string,
    messages: QueuedMessage[],
    deviceMetadata?: Record<string, any>
  ): StreamBatchPayload {
    const formattedMessages: ProcessedTopicData[] = messages.map((msg) =>
      this.formatTopicData(msg.topic, msg.data, msg.timestamp)
    );

    const payload: StreamBatchPayload = {
      timestamp: this.formatTimestamp(),
      platformDeviceId: deviceId,
      routineId,
      data: formattedMessages,
    };

    if (deviceMetadata) {
      payload.metadata = deviceMetadata;
    }

    return payload;
  }

  /**
   * Create a summary string for logging
   */
  static summarizePayload(payload: StreamBatchPayload): string {
    const messageCount = payload.data.length;
    const topics = payload.data.map((msg) => msg.topic).slice(0, 3);
    const topicSummary =
      topics.join(", ") + (payload.data.length > 3 ? "..." : "");

    const metadataInfo = payload.metadata
      ? ` with metadata: ${Object.keys(payload.metadata).join(", ")}`
      : "";

    return `Payload with ${messageCount} messages for device ${payload.platformDeviceId}${metadataInfo}. Topics: ${topicSummary}`;
  }
}
