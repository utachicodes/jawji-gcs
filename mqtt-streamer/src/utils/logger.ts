import winston from 'winston';
import { LOG_LEVEL } from '../config/env';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green", 
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

const createLogger = () => {
  const developmentFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, service, context, ...meta }) => {
      const serviceTag = service ? `[${service}]` : '[MQTT-STREAMER]';
      const contextTag = context ? `[${context}]` : '';
      const metaString = Object.keys(meta).length > 0 ? 
        `\n   ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n   ')}` : '';
      
      return `${timestamp} ${level} ${serviceTag}${contextTag}: ${message}${metaString}`;
    })
  );

  // Always use colored and formatted logs
  const logFormat = developmentFormat;

  // Define transports - console only with colored format
  const transports: winston.transport[] = [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
      format: logFormat
    })
  ];

  return winston.createLogger({
    level: LOG_LEVEL,
    levels,
    format: logFormat,
    defaultMeta: { service: 'mqtt-streamer' },
    transports,
    exitOnError: false
  });
};

export const logger = createLogger();

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: string, metadata: Record<string, any> = {}) {
  return logger.child({
    context,
    ...metadata
  });
}

/**
 * Enhanced logging helper functions with improved formatting
 */

/**
 * Log performance metrics with timing
 */
export function logPerformance(operation: string, startTime: number, metadata: Record<string, any> = {}) {
  const duration = Date.now() - startTime;
  const durationFormatted = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
  
  logger.info(`Performance: ${operation} completed in ${durationFormatted}`, {
    operation,
    duration_ms: duration,
    ...metadata
  });
}

/**
 * Log error with full context and stack trace
 */
export function logError(error: Error, context: string, metadata: Record<string, any> = {}) {
  logger.error(`Error in ${context}: ${error.message}`, {
    error_name: error.name,
    error_message: error.message,
    stack: error.stack,
    context,
    ...metadata
  });
}

/**
 * Log MQTT message (debug level) with topic highlighting
 */
export function logMQTTMessage(topic: string, payload: string, deviceId: string) {
  const truncatedPayload = payload.length > 100 ? 
    payload.substring(0, 100) + '...' : payload;
    
  logger.debug(`MQTT message from ${deviceId}`, {
    topic,
    payload: truncatedPayload,
    payload_size: payload.length,
    device_id: deviceId
  });
}

/**
 * Log stream batch with performance info
 */
export function logStreamBatch(deviceId: string, messageCount: number, endpoint: string, duration?: number) {
  const perfInfo = duration ? ` (${duration}ms)` : '';
  logger.info(`Batch sent: ${messageCount} messages${perfInfo}`, {
    device_id: deviceId,
    message_count: messageCount,
    endpoint,
    duration_ms: duration
  });
}

/**
 * Log configuration loading with validation info
 */
export function logConfigLoaded(configPath: string, deviceCount: number) {
  logger.info(`Configuration loaded: ${deviceCount} devices configured`, {
    config_path: configPath,
    device_count: deviceCount,
    config_source: 'file'
  });
}

/**
 * Log service startup with system info
 */
export function logServiceStartup(port: number, environment: string) {
  logger.info(`🚀 MQTT Streamer starting on port ${port}`, {
    port,
    environment,
    node_version: process.version,
    log_level: LOG_LEVEL,
    format: 'colored'
  });
}

/**
 * Log service shutdown with graceful info
 */
export function logServiceShutdown(signal: string) {
  const uptimeFormatted = `${Math.floor(process.uptime())}s`;
  logger.info(`🛑 Service shutting down (${signal}) - uptime: ${uptimeFormatted}`, {
    signal,
    uptime_seconds: Math.floor(process.uptime()),
    shutdown_reason: signal
  });
}

/**
 * Log HTTP requests with status color coding
 */
export function logRequest(method: string, url: string, statusCode: number, duration: number, userAgent?: string) {
  const statusEmoji = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌';
  const durationFormatted = `${duration}ms`;
  
  logger.http(`${statusEmoji} ${method} ${url} ${statusCode} - ${durationFormatted}`, {
    method,
    url,
    status_code: statusCode,
    duration_ms: duration,
    user_agent: userAgent
  });
}

/**
 * Log MQTT connection status changes
 */
export function logMQTTConnection(deviceId: string, status: 'connected' | 'disconnected' | 'reconnecting', metadata: Record<string, any> = {}) {
  const statusEmoji = status === 'connected' ? '🔗' : status === 'disconnected' ? '🔌' : '🔄';
  logger.info(`${statusEmoji} MQTT ${status}: ${deviceId}`, {
    device_id: deviceId,
    connection_status: status,
    ...metadata
  });
}

/**
 * Log critical system events
 */
export function logCritical(message: string, metadata: Record<string, any> = {}) {
  logger.error(`🚨 CRITICAL: ${message}`, {
    severity: 'critical',
    timestamp: new Date().toISOString(),
    ...metadata
  });
}