/**
 * System uptime tracking utilities
 */

import { logger } from "./logger";

class UptimeTracker {
  private startTime: number;
  private lastHealthCheck: number;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTime = Date.now();
    this.lastHealthCheck = Date.now();
  }

  /**
   * Get service uptime in milliseconds
   */
  getUptimeMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get service uptime as formatted string
   */
  getUptimeString(): string {
    const uptimeMs = this.getUptimeMs();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get uptime statistics
   */
  getUptimeStats() {
    const uptimeMs = this.getUptimeMs();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    return {
      uptime_ms: uptimeMs,
      uptime_seconds: uptimeSeconds,
      uptime_string: this.getUptimeString(),
      start_time: new Date(this.startTime).toISOString(),
      last_health_check: new Date(this.lastHealthCheck).toISOString(),
    };
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    logger.info("Health check monitoring started", {
      interval_ms: intervalMs,
    });
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info("Health check monitoring stopped");
    }
  }

  /**
   * Perform a health check
   */
  private performHealthCheck() {
    this.lastHealthCheck = Date.now();

    // Log basic health metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    logger.debug("Health check performed", {
      uptime: this.getUptimeString(),
      memory_usage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      cpu_usage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    });
  }

  /**
   * Get system health information
   */
  getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: this.getUptimeStats(),
      memory: {
        rss: memoryUsage.rss,
        heap_used: memoryUsage.heapUsed,
        heap_total: memoryUsage.heapTotal,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  /**
   * Reset uptime tracking (useful for testing)
   */
  reset() {
    this.startTime = Date.now();
    this.lastHealthCheck = Date.now();
    logger.info("Uptime tracking reset");
  }
}

// Export singleton instance
export const uptimeTracker = new UptimeTracker();

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get process resource usage
 */
export function getResourceUsage() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    cpu: {
      user_ms: Math.round(cpuUsage.user / 1000),
      system_ms: Math.round(cpuUsage.system / 1000),
    },
  };
}
