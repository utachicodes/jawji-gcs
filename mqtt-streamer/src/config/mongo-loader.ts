/**
 * MongoDB-based configuration loader for MQTT Streamer
 * Replaces YAML file configuration with dynamic MongoDB configuration
 */

import { connectWithRetry, waitForConnection } from "../database/connection";
import { StreamerConfigModel, IDeviceConfig } from "../database/models/streamer-config.model";
import { logger } from "../utils/logger";
import {
  AppConfigSchema,
  type AppConfig,
  type DeviceConfig,
} from "./types";

/**
 * Load configuration from MongoDB
 * @param configName - Name of the configuration to load (default: "main")
 * @returns Validated application configuration
 */
export async function loadAppConfigFromMongo(
  configName: string = "main"
): Promise<AppConfig> {
  try {
    // Ensure MongoDB is connected
    await connectWithRetry();
    await waitForConnection();

    logger.info(`Loading configuration from MongoDB: ${configName}`);

    // First, try to find the active configuration
    let config = await StreamerConfigModel.findOne({ isActive: true });

    // If no active config, try to find by name
    if (!config) {
      config = await StreamerConfigModel.findOne({ name: configName });
    }

    // If still no config, throw error
    if (!config) {
      throw new Error(
        `No configuration found in MongoDB. Please create a configuration with name: ${configName} or set one as active.`
      );
    }

    logger.info(`Found configuration: ${config.name} (active: ${config.isActive})`);

    // Transform MongoDB document to AppConfig format
    const appConfig: AppConfig = {
      mqtt: {
        endpoint: config.mqtt.endpoint,
        port: config.mqtt.port,
      },
      stream: {
        parameters: {
          endpoint: config.stream.parameters.endpoint,
          method: config.stream.parameters.method,
          headers: config.stream.parameters.headers instanceof Map
            ? Object.fromEntries(config.stream.parameters.headers)
            : config.stream.parameters.headers,
          streaming: {
            enabled: config.stream.parameters.streaming.enabled,
            rate: config.stream.parameters.streaming.rate,
          },
        },
      },
      devices: config.devices.map((device: IDeviceConfig): DeviceConfig => ({
        device_id: device.device_id,
        stack_name: device.stack_name,
        thing_name: device.thing_name,
        topics: {
          mode: device.topics.mode,
          list: device.topics.list,
          categories: device.topics.categories,
        },
        metadata: device.metadata,
      })),
    };

    // Validate configuration using Zod schema
    const validatedConfig = AppConfigSchema.parse(appConfig);

    logger.info(`Configuration loaded successfully: ${config.devices.length} devices configured`);

    return validatedConfig;
  } catch (error: any) {
    logger.error(`Failed to load configuration from MongoDB: ${error.message}`, { error });
    throw new Error(`MongoDB configuration loading failed: ${error.message}`);
  }
}

/**
 * Create or update configuration in MongoDB
 * This is a helper function for initial setup or updates
 */
export async function saveAppConfigToMongo(
  configName: string,
  appConfig: AppConfig,
  setAsActive: boolean = true
): Promise<void> {
  try {
    await connectWithRetry();
    await waitForConnection();

    logger.info(`Saving configuration to MongoDB: ${configName}`);

    // Validate configuration first
    const validatedConfig = AppConfigSchema.parse(appConfig);

    // Create or update configuration
    await StreamerConfigModel.findOneAndUpdate(
      { name: configName },
      {
        name: configName,
        mqtt: validatedConfig.mqtt,
        stream: validatedConfig.stream,
        devices: validatedConfig.devices,
        isActive: setAsActive,
      },
      { upsert: true, new: true }
    );

    logger.info(`Configuration saved successfully: ${configName}`);
  } catch (error: any) {
    logger.error(`Failed to save configuration to MongoDB: ${error.message}`, { error });
    throw new Error(`MongoDB configuration save failed: ${error.message}`);
  }
}

/**
 * List all available configurations
 */
export async function listConfigurations(): Promise<Array<{ name: string; isActive: boolean; deviceCount: number }>> {
  try {
    await connectWithRetry();
    await waitForConnection();

    const configs = await StreamerConfigModel.find({}, { name: 1, isActive: 1, devices: 1 });

    return configs.map((config) => ({
      name: config.name,
      isActive: config.isActive,
      deviceCount: config.devices.length,
    }));
  } catch (error: any) {
    logger.error(`Failed to list configurations: ${error.message}`, { error });
    throw new Error(`Failed to list configurations: ${error.message}`);
  }
}

/**
 * Set a configuration as active
 */
export async function setActiveConfiguration(configName: string): Promise<void> {
  try {
    await connectWithRetry();
    await waitForConnection();

    // Deactivate all configs
    await StreamerConfigModel.updateMany({}, { $set: { isActive: false } });

    // Activate the specified config
    const result = await StreamerConfigModel.findOneAndUpdate(
      { name: configName },
      { $set: { isActive: true } },
      { new: true }
    );

    if (!result) {
      throw new Error(`Configuration not found: ${configName}`);
    }

    logger.info(`Configuration set as active: ${configName}`);
  } catch (error: any) {
    logger.error(`Failed to set active configuration: ${error.message}`, { error });
    throw new Error(`Failed to set active configuration: ${error.message}`);
  }
}
