/**
 * Status and monitoring routes
 */

import { Router, Request, Response } from "express";
import { uptimeTracker } from "../../utils/uptime";
import { AppDependencies } from "../server";
import { asyncHandler, createApiError } from "../middleware/error";

export function statusRoutes(deps: AppDependencies): Router {
  const router = Router();

  // Get overall system status
  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const mqttStats = deps.mqttManager.getStats();
      const systemHealth = uptimeTracker.getSystemHealth();

      const deviceStatuses: Record<string, any> = {};
      for (const deviceId of deps.mqttManager.getDeviceIds()) {
        const streamManager = deps.streamManagers.get(deviceId);

        deviceStatuses[deviceId] = {
          mqtt: mqttStats.devices[deviceId] || null,
          stream: streamManager ? streamManager.getStats() : null,
        };
      }

      res.json({
        service: {
          uptime: uptimeTracker.getUptimeString(),
          devices: mqttStats.totalDevices,
          timestamp: new Date().toISOString(),
        },
        mqtt_connections: mqttStats,
        devices: deviceStatuses,
        system: systemHealth,
      });
    })
  );

  // Get statistics for all devices
  router.get(
    "/stats",
    asyncHandler(async (req: Request, res: Response) => {
      const mqttStats = deps.mqttManager.getStats();
      const stats: Record<string, any> = {};

      for (const deviceId of deps.mqttManager.getDeviceIds()) {
        const streamManager = deps.streamManagers.get(deviceId);

        stats[deviceId] = {
          mqtt: mqttStats.devices[deviceId] || null,
          stream: streamManager ? streamManager.getStats() : null,
        };
      }

      res.json({
        service: {
          uptime: uptimeTracker.getUptimeString(),
          devices: Object.keys(stats).length,
          timestamp: new Date().toISOString(),
        },
        devices: stats,
      });
    })
  );

  // Get statistics for specific device
  router.get(
    "/stats/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const mqttStats = deps.mqttManager.getStats();
      const streamManager = deps.streamManagers.get(deviceId);

      if (!mqttStats.devices[deviceId] || !streamManager) {
        res.status(404).json({
          error: "Not Found",
          message: `Device ${deviceId} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        device_id: deviceId,
        mqtt: mqttStats.devices[deviceId],
        stream: streamManager.getStats(),
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Get MQTT connection summary
  router.get(
    "/mqtt",
    asyncHandler(async (req: Request, res: Response) => {
      const mqttStats = deps.mqttManager.getStats();

      res.json({
        summary: {
          totalDevices: mqttStats.totalDevices,
          totalConnections: mqttStats.totalConnections,
          connectedConnections: mqttStats.connectedConnections,
          devicesReady: mqttStats.devicesReady,
          totalTopicsDiscovered: mqttStats.totalTopicsDiscovered,
          totalMessagesReceived: mqttStats.totalMessagesReceived,
        },
        devices: mqttStats.devices,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Get streaming status
  router.get(
    "/stream",
    asyncHandler(async (req: Request, res: Response) => {
      const streamStats: Record<string, any> = {};

      for (const [deviceId, streamManager] of deps.streamManagers) {
        streamStats[deviceId] = streamManager.getStats();
      }

      res.json({
        devices: streamStats,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Get discovered topics for devices
  router.get(
    "/topics",
    asyncHandler(async (req: Request, res: Response) => {
      const mqttStats = deps.mqttManager.getStats();
      const topicsInfo: Record<string, any> = {};

      for (const deviceId of deps.mqttManager.getDeviceIds()) {
        const deviceStats = mqttStats.devices[deviceId];
        if (deviceStats) {
          topicsInfo[deviceId] = {
            topics_discovered: deviceStats.topicsDiscovered,
            topics_subscribed: deviceStats.topicsSubscribed,
            status: deviceStats.status,
          };
        }
      }

      res.json({
        devices: topicsInfo,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Get discovered topics for specific device
  router.get(
    "/topics/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const mqttStats = deps.mqttManager.getStats();
      const deviceStats = mqttStats.devices[deviceId];

      if (!deviceStats) {
        res.status(404).json({
          error: "Not Found",
          message: `Device ${deviceId} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      res.json({
        device_id: deviceId,
        topics_discovered: deviceStats.topicsDiscovered,
        topics_subscribed: deviceStats.topicsSubscribed,
        status: deviceStats.status,
        thing_name: deviceStats.thingName,
        timestamp: new Date().toISOString(),
      });
    })
  );

  return router;
}
