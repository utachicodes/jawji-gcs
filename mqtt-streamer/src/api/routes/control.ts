/**
 * Device control routes
 */

import { Router, Request, Response } from "express";
import { AppDependencies } from "../server";
import { asyncHandler, createApiError } from "../middleware/error";

export function controlRoutes(deps: AppDependencies): Router {
  const router = Router();

  // Pause streaming for a device
  router.post(
    "/pause/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const streamManager = deps.streamManagers.get(deviceId);
      if (!streamManager) {
        throw createApiError(`Device ${deviceId} not found`, 404);
      }

      streamManager.pause();

      res.json({
        message: `Streaming paused for device ${deviceId}`,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Resume streaming for a device
  router.post(
    "/resume/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const streamManager = deps.streamManagers.get(deviceId);
      if (!streamManager) {
        throw createApiError(`Device ${deviceId} not found`, 404);
      }

      streamManager.resume();

      res.json({
        message: `Streaming resumed for device ${deviceId}`,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Stop streaming for a device
  router.post(
    "/stop/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const streamManager = deps.streamManagers.get(deviceId);
      if (!streamManager) {
        throw createApiError(`Device ${deviceId} not found`, 404);
      }

      streamManager.stop();

      res.json({
        message: `Streaming stopped for device ${deviceId}`,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Clear message queue for a device
  router.post(
    "/clear-queue/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const streamManager = deps.streamManagers.get(deviceId);
      if (!streamManager) {
        throw createApiError(`Device ${deviceId} not found`, 404);
      }

      const clearedCount = streamManager.clearQueue();

      res.json({
        message: `Queue cleared for device ${deviceId}`,
        device_id: deviceId,
        removed_messages: clearedCount,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Get device status
  router.get(
    "/status/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const streamManager = deps.streamManagers.get(deviceId);
      const mqttStats = deps.mqttManager.getStats();
      const deviceStats = mqttStats.devices[deviceId];

      if (!streamManager || !deviceStats) {
        throw createApiError(`Device ${deviceId} not found`, 404);
      }

      res.json({
        device_id: deviceId,
        mqtt_connected: deviceStats.status === 'ready',
        mqtt_connections: deviceStats.connections,
        stream_status: streamManager.getStatus(),
        queue_size: streamManager.getQueueSize(),
        timestamp: new Date().toISOString(),
      });
    })
  );

  // Get all devices status
  router.get(
    "/status",
    asyncHandler(async (_req: Request, res: Response) => {
      const mqttStats = deps.mqttManager.getStats();
      const deviceStatuses: Record<string, any> = {};

      for (const deviceId of deps.mqttManager.getDeviceIds()) {
        const streamManager = deps.streamManagers.get(deviceId);
        const deviceStats = mqttStats.devices[deviceId];

        if (streamManager && deviceStats) {
          deviceStatuses[deviceId] = {
            mqtt_connected: deviceStats.status === 'ready',
            mqtt_connections: deviceStats.connections,
            stream_status: streamManager.getStatus(),
            queue_size: streamManager.getQueueSize(),
          };
        }
      }

      res.json({
        devices: deviceStatuses,
        timestamp: new Date().toISOString(),
      });
    })
  );

  return router;
}
