/**
 * Command execution routes
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { AppDependencies } from "../server";
import { asyncHandler, createApiError } from "../middleware/error";
import { validateRequestBody } from "../../utils/validation";
import { CommandRequest } from "../../core/command/handler";
import { BulkCommandRequest } from "../../types/api";

// Command request schema
const CommandRequestSchema = z.object({
  device_id: z.string().min(1),
  topic: z.string().min(1),
  state: z.string().min(1),
  topic_type: z.string().optional(),
  additional_params: z.record(z.any()).optional(),
  qos: z.number().min(0).max(2).optional().default(1),
});

// Bulk command request schema
const BulkCommandRequestSchema = z.object({
  commands: z.array(z.object({
    device_id: z.string().min(1),
    topic: z.string().min(1),
    state: z.string().min(1),
    topic_type: z.string().optional(),
    additional_params: z.record(z.any()).optional(),
    qos: z.number().min(0).max(2).optional().default(1),
  })).min(1),
});

export function commandRoutes(deps: AppDependencies): Router {
  const router = Router();

  // Send command to device
  router.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      // Validate request body
      const validatedRequest = validateRequestBody(
        req.body,
        CommandRequestSchema
      );

      // Convert to CommandRequest type
      const commandRequest: CommandRequest = {
        device_id: validatedRequest.device_id,
        topic: validatedRequest.topic,
        state: validatedRequest.state,
        topic_type: validatedRequest.topic_type,
        additional_params: validatedRequest.additional_params,
        qos: validatedRequest.qos,
      };

      // Additional validation
      deps.commandHandler.validateRequest(commandRequest);

      // Process command
      const result = await deps.commandHandler.processCommand(commandRequest);

      res.json(result);
    })
  );

  // Send bulk command to multiple devices
  router.post(
    "/bulk",
    asyncHandler(async (req: Request, res: Response) => {
      // Validate request body
      const validatedRequest = validateRequestBody(
        req.body,
        BulkCommandRequestSchema
      );

      // Convert to BulkCommandRequest type
      const bulkCommandRequest: BulkCommandRequest = {
        commands: validatedRequest.commands,
      };

      // Process bulk command with parallel execution
      const result = await deps.commandHandler.processBulkCommand(bulkCommandRequest);

      res.json(result);
    })
  );

  // Send command to device with device ID in URL
  router.post(
    "/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      // Merge device ID with request body
      const requestBody = {
        ...req.body,
        device_id:deviceId,
      };

      // Validate request body
      const validatedRequest = validateRequestBody(
        requestBody,
        CommandRequestSchema
      );

      // Convert to CommandRequest type
      const commandRequest: CommandRequest = {
        device_id: validatedRequest.device_id,
        topic: validatedRequest.topic,
        state: validatedRequest.state,
        topic_type: validatedRequest.topic_type,
        additional_params: validatedRequest.additional_params,
        qos: validatedRequest.qos,
      };

      // Additional validation
      deps.commandHandler.validateRequest(commandRequest);

      // Process command
      const result = await deps.commandHandler.processCommand(commandRequest);

      res.json(result);
    })
  );

  // Get command history (placeholder for future implementation)
  router.get(
    "/history/:deviceId",
    asyncHandler(async (req: Request, res: Response) => {
      const deviceId = req.params.deviceId;

      if (!deviceId) {
        throw createApiError("Device ID is required", 400);
      }

      // For now, return empty history
      res.json({
        device_id: deviceId,
        commands: [],
        message: "Command history not implemented yet",
        timestamp: new Date().toISOString(),
      });
    })
  );

  return router;
}
