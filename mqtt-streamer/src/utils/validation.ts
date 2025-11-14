/**
 * Input validation utilities
 */

import { z } from "zod";
import { logger } from "./logger";

/**
 * Validate device ID format
 */
export function validateDeviceId(deviceId: string): boolean {
  const deviceIdSchema = z.string().min(1).max(100);
  try {
    deviceIdSchema.parse(deviceId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate topic format
 */
export function validateTopic(topic: string): boolean {
  const topicSchema = z
    .string()
    .min(1)
    .max(1000)
    .regex(/^[a-zA-Z0-9/_-]+$/);
  try {
    topicSchema.parse(topic);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate state value
 */
export function validateState(state: string): boolean {
  const stateSchema = z.string().min(1).max(100);
  try {
    stateSchema.parse(state);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate QoS level
 */
export function validateQoS(qos: number): boolean {
  const qosSchema = z.number().min(0).max(2);
  try {
    qosSchema.parse(qos);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate timestamp format (ISO 8601)
 */
export function validateTimestamp(timestamp: string): boolean {
  const timestampSchema = z.string().datetime();
  try {
    timestampSchema.parse(timestamp);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  const urlSchema = z.string().url();
  try {
    urlSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize topic string
 */
export function sanitizeTopic(topic: string): string {
  return topic.replace(/[^a-zA-Z0-9/_-]/g, "").substring(0, 1000);
}

/**
 * Sanitize device ID
 */
export function sanitizeDeviceId(deviceId: string): string {
  return deviceId.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 100);
}

/**
 * Validate and sanitize JSON payload
 */
export function validateJsonPayload(payload: string): any {
  try {
    const parsed = JSON.parse(payload);
    return parsed;
  } catch (error) {
    logger.warn("Invalid JSON payload", { payload: payload.substring(0, 100) });
    throw new Error("Invalid JSON payload");
  }
}

/**
 * Validate array of strings
 */
export function validateStringArray(arr: unknown): string[] {
  const schema = z.array(z.string());
  try {
    return schema.parse(arr);
  } catch {
    throw new Error("Invalid string array");
  }
}

/**
 * Validate numeric value
 */
export function validateNumeric(value: unknown): number {
  const schema = z.number();
  try {
    return schema.parse(value);
  } catch {
    throw new Error("Invalid numeric value");
  }
}

/**
 * Create validation error response
 */
export function createValidationError(field: string, message: string) {
  return {
    error: "Validation Error",
    field,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      throw new Error(`Validation failed: ${messages.join(", ")}`);
    }
    throw error;
  }
}
