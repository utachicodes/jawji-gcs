/**
 * Device health monitoring routes
 */

import { Router, Request, Response } from "express";
import { AppDependencies } from "../server";
import { asyncHandler, createApiError } from "../middleware/error";

export function healthRoutes(deps: AppDependencies): Router {
  const router = Router();

  /**
   * Get health summary for all devices
   */
  router.get(
    "/",
    asyncHandler(async (_req: Request, res: Response) => {
      const healthSummary = deps.mqttManager.getHealthSummary();
      
      res.json({
        ...healthSummary,
        timestamp: new Date().toISOString()
      });
    })
  );

  /**
   * Get detailed health status for specific device
   */
  router.get(
    "/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      const deviceHealth = deps.mqttManager.getDeviceHealth(deviceId);
      
      if (!deviceHealth) {
        res.status(404).json({
          error: "Not Found",
          message: `Device ${deviceId} not found in health monitor`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        device_id: deviceId,
        health: deviceHealth,
        timestamp: new Date().toISOString()
      });
    })
  );

  /**
   * Force retry for a specific device
   */
  router.post(
    "/:deviceId/retry",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      try {
        await deps.mqttManager.forceDeviceRetry(deviceId);
        
        res.json({
          success: true,
          message: `Retry initiated for device ${deviceId}`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        throw createApiError(
          `Failed to retry device ${deviceId}: ${(error as Error).message}`,
          500
        );
      }
    })
  );

  /**
   * Get all device health statuses
   */
  router.get(
    "/devices/all",
    asyncHandler(async (_req: Request, res: Response) => {
      const allHealth = deps.mqttManager.getAllDeviceHealth();
      
      const healthArray = Array.from(allHealth.entries()).map(([deviceId, health]) => ({
        device_id: deviceId,
        ...health
      }));

      res.json({
        devices: healthArray,
        total: healthArray.length,
        timestamp: new Date().toISOString()
      });
    })
  );

  return router;
}
