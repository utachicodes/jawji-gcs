/**
 * Device Health Monitor with Exponential Backoff
 * 
 * Features:
 * - Tracks device initialization status
 * - Exponential backoff for failed devices
 * - Periodic health checks to detect when offline devices come back
 * - Automatic re-initialization of recovered devices
 */

import { createChildLogger } from "../../utils/logger";
import { DeviceConfig } from "../../types/common";

export interface DeviceHealthStatus {
  deviceId: string;
  status: 'initializing' | 'ready' | 'failed' | 'retrying';
  lastAttempt: number;
  failureCount: number;
  nextRetry: number | null;
  error: string | null;
}

export interface HealthMonitorConfig {
  initialRetryDelay: number;      
  maxRetryDelay: number;           
  retryBackoffMultiplier: number;  
  maxRetries: number | null;       
  healthCheckInterval: number;     
}

const DEFAULT_CONFIG: HealthMonitorConfig = {
  initialRetryDelay: 5000,         // 5 seconds
  maxRetryDelay: 300000,           // 5 minutes
  retryBackoffMultiplier: 2,       // Exponential: 5s, 10s, 20s, 40s, 80s, 160s, 300s
  maxRetries: null,                // Unlimited retries
  healthCheckInterval: 30000       // Check every 30 seconds
};

export class DeviceHealthMonitor {
  private readonly logger: ReturnType<typeof createChildLogger>;
  private readonly config: HealthMonitorConfig;
  
  private readonly deviceHealth: Map<string, DeviceHealthStatus> = new Map();
  private readonly deviceConfigs: Map<string, DeviceConfig> = new Map();
  
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Callback for re-initialization attempts
  private reinitCallback: ((config: DeviceConfig) => Promise<void>) | null = null;

  constructor(config?: Partial<HealthMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createChildLogger("DeviceHealthMonitor");
  }

  /**
   * Register a device for health monitoring
   */
  registerDevice(config: DeviceConfig): void {
    this.deviceConfigs.set(config.device_id, config);
    
    if (!this.deviceHealth.has(config.device_id)) {
      this.deviceHealth.set(config.device_id, {
        deviceId: config.device_id,
        status: 'initializing',
        lastAttempt: Date.now(),
        failureCount: 0,
        nextRetry: null,
        error: null
      });
      
      this.logger.info("Device registered for health monitoring", {
        device_id: config.device_id,
        thing_name: config.thing_name
      });
    }
  }

  /**
   * Mark device as successfully initialized
   */
  markDeviceReady(deviceId: string): void {
    const health = this.deviceHealth.get(deviceId);
    if (!health) return;

    health.status = 'ready';
    health.failureCount = 0;
    health.nextRetry = null;
    health.error = null;

    // Clear any pending retry timer
    const timer = this.retryTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(deviceId);
    }

    this.logger.info("Device marked as ready", {
      device_id: deviceId,
      previous_failures: health.failureCount
    });
  }

  /**
   * Mark device initialization as failed and schedule retry
   */
  markDeviceFailed(deviceId: string, error: Error | string): void {
    const health = this.deviceHealth.get(deviceId);
    if (!health) return;

    health.failureCount++;
    health.lastAttempt = Date.now();
    health.error = error instanceof Error ? error.message : error;

    // Check if max retries exceeded
    if (this.config.maxRetries !== null && health.failureCount >= this.config.maxRetries) {
      health.status = 'failed';
      health.nextRetry = null;
      
      this.logger.error("Device failed - max retries exceeded", {
        device_id: deviceId,
        failure_count: health.failureCount,
        max_retries: this.config.maxRetries,
        error: health.error
      });
      return;
    }

    // Calculate exponential backoff delay
    const delay = this.calculateBackoffDelay(health.failureCount);
    health.nextRetry = Date.now() + delay;
    health.status = 'retrying';

    this.logger.warn("Device initialization failed - scheduling retry", {
      device_id: deviceId,
      failure_count: health.failureCount,
      retry_in_seconds: Math.round(delay / 1000),
      error: health.error
    });

    // Schedule retry
    this.scheduleRetry(deviceId, delay);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(failureCount: number): number {
    const delay = this.config.initialRetryDelay * Math.pow(
      this.config.retryBackoffMultiplier,
      failureCount - 1
    );
    
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * Schedule device retry
   */
  private scheduleRetry(deviceId: string, delay: number): void {
    // Clear existing timer if any
    const existingTimer = this.retryTimers.get(deviceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new retry
    const timer = setTimeout(async () => {
      this.retryTimers.delete(deviceId);
      await this.attemptDeviceReinit(deviceId);
    }, delay);

    this.retryTimers.set(deviceId, timer);
  }

  /**
   * Attempt to re-initialize a device
   */
  private async attemptDeviceReinit(deviceId: string): Promise<void> {
    const config = this.deviceConfigs.get(deviceId);
    const health = this.deviceHealth.get(deviceId);
    
    if (!config || !health) return;

    this.logger.info("Attempting device re-initialization", {
      device_id: deviceId,
      attempt: health.failureCount + 1
    });

    health.status = 'initializing';
    health.lastAttempt = Date.now();

    try {
      if (this.reinitCallback) {
        await this.reinitCallback(config);
        this.markDeviceReady(deviceId);
      }
    } catch (error) {
      this.markDeviceFailed(deviceId, error as Error);
    }
  }

  /**
   * Set callback for device re-initialization
   */
  setReinitCallback(callback: (config: DeviceConfig) => Promise<void>): void {
    this.reinitCallback = callback;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckTimer) {
      return; // Already running
    }

    this.logger.info("Starting periodic health checks", {
      interval_seconds: Math.round(this.config.healthCheckInterval / 1000)
    });

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Clear all retry timers
    this.retryTimers.forEach(timer => clearTimeout(timer));
    this.retryTimers.clear();

    this.logger.info("Health checks stopped");
  }

  /**
   * Perform health check on all devices
   */
  private performHealthCheck(): void {
    const failedDevices: string[] = [];
    const retryingDevices: string[] = [];

    this.deviceHealth.forEach((health, deviceId) => {
      if (health.status === 'failed') {
        failedDevices.push(deviceId);
      } else if (health.status === 'retrying') {
        retryingDevices.push(deviceId);
      }
    });

    if (failedDevices.length > 0 || retryingDevices.length > 0) {
      this.logger.info("Health check summary", {
        total_devices: this.deviceHealth.size,
        ready: Array.from(this.deviceHealth.values()).filter(h => h.status === 'ready').length,
        retrying: retryingDevices.length,
        failed: failedDevices.length
      });
    }
  }

  /**
   * Get health status for a specific device
   */
  getDeviceHealth(deviceId: string): DeviceHealthStatus | null {
    return this.deviceHealth.get(deviceId) || null;
  }

  /**
   * Get health status for all devices
   */
  getAllDeviceHealth(): Map<string, DeviceHealthStatus> {
    return new Map(this.deviceHealth);
  }

  /**
   * Get health summary statistics
   */
  getHealthSummary() {
    const summary = {
      total: this.deviceHealth.size,
      ready: 0,
      initializing: 0,
      retrying: 0,
      failed: 0,
      devices: {} as Record<string, DeviceHealthStatus>
    };

    this.deviceHealth.forEach((health, deviceId) => {
      switch (health.status) {
        case 'ready': summary.ready++; break;
        case 'initializing': summary.initializing++; break;
        case 'retrying': summary.retrying++; break;
        case 'failed': summary.failed++; break;
      }
      
      summary.devices[deviceId] = { ...health };
    });

    return summary;
  }

  /**
   * Force retry for a specific device
   */
  async forceRetry(deviceId: string): Promise<void> {
    const health = this.deviceHealth.get(deviceId);
    if (!health) {
      throw new Error(`Device ${deviceId} not found in health monitor`);
    }

    if (health.status === 'ready') {
      this.logger.warn("Device is already ready, skipping retry", { device_id: deviceId });
      return;
    }

    this.logger.info("Forcing device retry", { device_id: deviceId });
    
    // Clear pending retry timer
    const timer = this.retryTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(deviceId);
    }

    // Reset failure count for manual retry
    health.failureCount = 0;
    await this.attemptDeviceReinit(deviceId);
  }

  /**
   * Reset device health status (useful for testing)
   */
  resetDevice(deviceId: string): void {
    const config = this.deviceConfigs.get(deviceId);
    if (!config) return;

    // Clear retry timer
    const timer = this.retryTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(deviceId);
    }

    // Reset health status
    this.deviceHealth.set(deviceId, {
      deviceId,
      status: 'initializing',
      lastAttempt: Date.now(),
      failureCount: 0,
      nextRetry: null,
      error: null
    });

    this.logger.info("Device health reset", { device_id: deviceId });
  }
}
