/**
 * Configuration loader with validation and error handling
 * Supports both YAML file and MongoDB configuration sources
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  AppConfigSchema,
  CertificatePathsSchema,
  type AppConfig,
  type CertificatePaths,
  type EnvConfig
} from './types';
import { loadAppConfigFromMongo } from './mongo-loader';
import { loadAppConfigFromSupabase } from './supabase-loader';
import { env, USE_MONGO_CONFIG, USE_SUPABASE_CONFIG, MONGO_CONFIG_NAME, CONFIG_NAME } from './env';

// Re-export MongoDB loader functions for external use
export {
  loadAppConfigFromMongo,
  saveAppConfigToMongo,
  listConfigurations,
  setActiveConfiguration
} from './mongo-loader';

export { loadAppConfigFromSupabase } from './supabase-loader';

// Re-export environment configuration for convenience
export { env } from './env';
export * from './env';

/**
 * Load and validate environment configuration
 * Now uses centralized env configuration
 */
export function loadEnvConfig(): EnvConfig {
  return env;
}

/**
 * Load and validate application configuration from YAML file
 */
export function loadAppConfig(configPath: string): AppConfig {
  try {
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    // Read and parse YAML file
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const rawConfig = yaml.load(fileContent);

    // Validate configuration
    const config = AppConfigSchema.parse(rawConfig);
    
    console.log(`Configuration loaded successfully from ${configPath}`);
    console.log(`Found ${config.devices.length} devices in configuration`);
    
    return config;
  } catch (error) {
    console.error(`Failed to load configuration from ${configPath}:`, error);
    throw new Error(`Invalid configuration file: ${configPath}`);
  }
}

/**
 * Load and validate certificate paths
 */
export function loadCertificatePaths(envConfig: EnvConfig): CertificatePaths {
  try {
    const certPaths = {
      root_ca: path.join(envConfig.CERTS_DIR, envConfig.ROOT_CA),
      cert: path.join(envConfig.CERTS_DIR, envConfig.CERT),
      private_key: path.join(envConfig.CERTS_DIR, envConfig.PRIVATE_KEY)
    };

    // Validate paths
    const validatedPaths = CertificatePathsSchema.parse(certPaths);

    // Check if certificate files exist
    Object.entries(validatedPaths).forEach(([key, filePath]) => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Certificate file not found: ${filePath} (${key})`);
      }
    });

    console.log('Certificate paths validated successfully');
    return validatedPaths;
  } catch (error) {
    console.error('Failed to load certificate paths:', error);
    throw new Error('Invalid certificate configuration');
  }
}

/**
 * Load complete configuration
 * Supports both YAML file and MongoDB configuration sources
 * Set USE_MONGO_CONFIG=true in .env to use MongoDB configuration
 */
export async function loadConfig(): Promise<{
  env: EnvConfig;
  app: AppConfig;
  certs: CertificatePaths;
}> {
  const envConfig = loadEnvConfig();
  
  let app: AppConfig;
  
  if (USE_MONGO_CONFIG) {
    console.log('Loading configuration from MongoDB...');
    app = await loadAppConfigFromMongo(MONGO_CONFIG_NAME);
  } else if (USE_SUPABASE_CONFIG) {
    console.log('Loading configuration from Supabase...');
    app = await loadAppConfigFromSupabase(CONFIG_NAME);
  } else {
    console.log('Loading configuration from YAML file...');
    app = loadAppConfig(envConfig.CONFIG_PATH);
  }
  
  const certs = loadCertificatePaths(envConfig);

  return { env: envConfig, app, certs };
}

/**
 * Validate configuration compatibility
 */
export function validateConfigCompatibility(config: AppConfig): void {
  const warnings: string[] = [];

  // Check for missing required sections
  if (!config.mqtt) {
    throw new Error('MQTT configuration is required');
  }

  if (!config.stream) {
    throw new Error('Stream configuration is required');
  }

  if (!config.devices || config.devices.length === 0) {
    throw new Error('At least one device must be configured');
  }

  // Validate device configurations
  config.devices.forEach((device) => {
    if (device.topics.mode === 'selected' && device.topics.list.length === 0) {
      warnings.push(`Device ${device.device_id} has selected mode but no topics listed`);
    }

    if (!device.thing_name && !device.stack_name) {
      throw new Error(`Device ${device.device_id} must have either thing_name or stack_name`);
    }
  });

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => console.warn(warning));
  }

  console.log('Configuration validation completed');
}