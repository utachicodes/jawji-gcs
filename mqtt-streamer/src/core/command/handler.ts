/**
 * Command handler for device control
 */

import { createChildLogger } from "../../utils/logger";
import { MultiDeviceMQTTClient } from "../mqtt/manager";
import { BulkCommandRequest, BulkCommandResponse, BulkCommandResult } from "../../types/api";

export interface CommandRequest {
  device_id: string;
  topic: string;
  state: string;
  topic_type?: string;
  additional_params?: Record<string, any>;
  qos?: number;
}

export interface CommandResponse {
  message: string;
  device_id: string;
  state: string;
  topic: string;
  command_type: string;
  timestamp: string;
}

export class CommandHandler {
  private readonly mqttManager: MultiDeviceMQTTClient;
  private readonly commandLogger: ReturnType<typeof createChildLogger>;

  constructor(mqttManager: MultiDeviceMQTTClient) {
    this.mqttManager = mqttManager;
    this.commandLogger = createChildLogger("CommandHandler");
  }

  /**
   * Process state command
   */
  async processCommand(request: CommandRequest): Promise<CommandResponse> {
    const { device_id, topic, state, additional_params } = request;

    this.commandLogger.info("Processing command", {
      device_id,
      topic,
      state,
    });

    const deviceConfig = this.mqttManager.getDeviceConfig(device_id);
    if (!deviceConfig) {
      throw new Error(`Device ${device_id} not found`);
    }

    const mqttStats = this.mqttManager.getStats();
    const deviceStats = mqttStats.devices[device_id];
    if (!deviceStats || deviceStats.status !== 'ready') {
      throw new Error(`Device ${device_id} not connected`);
    }

    const thingName = deviceConfig.thing_name;

    let targetTopic: string;
    let payload: string;
    let commandType: string;

    try {
      if (topic.endsWith("/state")) {
        const commandTopic = topic.replace("/state", "/command");
        targetTopic = `${thingName}/sub`;

        const commandPayload = {
          type: "CMD",
          topic_names: [commandTopic],
          states: [state],
          ...(additional_params || {}),
        };

        payload = JSON.stringify(commandPayload);
        commandType = "state_to_command";

        this.commandLogger.debug("State command prepared", {
          original_topic: topic,
          command_topic: commandTopic,
          target_topic: targetTopic,
          payload: commandPayload
        });
      } else if (topic.endsWith("/command")) {
        targetTopic = `${thingName}/${topic}`;

        if (additional_params) {
          payload = JSON.stringify({
            state,
            ...additional_params,
          });
        } else {
          payload = state;
        }

        commandType = "direct_command";

        this.commandLogger.debug("Direct command prepared", {
          topic,
          target_topic: targetTopic,
        });
      } else {
        // For direct device control, send command via /sub topic with proper payload
        targetTopic = `${thingName}/sub`;

        const customPayload = {
          type: "CMD",
          topic_names: [`${topic}/command`],
          states: [state],
          ...(additional_params || {}),
        };

        payload = JSON.stringify(customPayload);
        commandType = "custom_topic";

        this.commandLogger.debug("Custom command prepared", {
          topic,
          command_topic: `${topic}/command`,
          target_topic: targetTopic,
          payload: customPayload
        });
      }

      // Remove thing_name prefix from topic since publish() adds it
      const topicWithoutPrefix = targetTopic.startsWith(`${thingName}/`) 
        ? targetTopic.substring(thingName.length + 1)
        : targetTopic;
      
      await this.mqttManager.publish(device_id, topicWithoutPrefix, payload);

      this.commandLogger.info("Command sent successfully", {
        device_id,
        target_topic: targetTopic,
        command_type: commandType,
      });

      return {
        message: "Command sent successfully",
        device_id,
        state,
        topic: targetTopic,
        command_type: commandType,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.commandLogger.error("Failed to send command", {
        device_id,
        topic,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new Error(
        `Failed to send command: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Process bulk command to multiple devices in parallel
   */
  async processBulkCommand(request: BulkCommandRequest): Promise<BulkCommandResponse> {
    const startTime = Date.now();
    const { commands } = request;

    this.commandLogger.info("Processing bulk command", {
      command_count: commands.length,
    });

    // Convert bulk command items to individual command requests
    const commandRequests: CommandRequest[] = commands.map(cmd => ({
      device_id: cmd.device_id,
      topic: cmd.topic,
      state: cmd.state,
      topic_type: cmd.topic_type,
      additional_params: cmd.additional_params,
      qos: cmd.qos,
    }));

    const commandPromises = commandRequests.map(async (commandRequest): Promise<BulkCommandResult> => {
      try {
        // Validate individual command request
        this.validateRequest(commandRequest);
        
        // Process the command
        const result = await this.processCommand(commandRequest);
        
        return {
          device_id: commandRequest.device_id,
          status: 'success',
          message: result.message,
          command_type: result.command_type,
        };
      } catch (error) {
        this.commandLogger.error("Bulk command failed for device", {
          device_id: commandRequest.device_id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
          device_id: commandRequest.device_id,
          status: 'error',
          message: "Command failed",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Wait for all commands to complete
    const results = await Promise.all(commandPromises);
    
    const executionTime = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    this.commandLogger.info("Bulk command completed", {
      total: commands.length,
      successful,
      failed,
      execution_time_ms: executionTime,
    });

    return {
      summary: {
        total: commands.length,
        successful,
        failed,
        execution_time_ms: executionTime,
      },
      results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate command request
   */
  validateRequest(request: CommandRequest): void {
    if (!request.device_id) {
      throw new Error("device_id is required");
    }

    if (!request.topic) {
      throw new Error("topic is required");
    }

    if (!request.state) {
      throw new Error("state is required");
    }

    const deviceConfig = this.mqttManager.getDeviceConfig(request.device_id);
    if (!deviceConfig) {
      throw new Error(`Device ${request.device_id} not found in configuration`);
    }
  }
}
