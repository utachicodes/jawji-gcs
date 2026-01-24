/**
 * Centralized environment configuration
 * Import this file to access environment variables throughout the application
 */

import { config as dotenvConfig } from 'dotenv';
import { EnvSchema } from './types';

// Load environment variables from .env file
dotenvConfig();

/**
 * Validated environment configuration
 * All environment variables are validated using Zod schema
 */
const loadEnvironment = () => {
  try {
    const parsed = EnvSchema.parse(process.env);
    console.log('✅ Environment configuration loaded successfully');
    return parsed;
  } catch (error) {
    console.error('❌ Failed to load environment configuration:', error);
    throw new Error('Invalid environment configuration');
  }
};

// Export the validated environment configuration
export const env = loadEnvironment();

// Export individual environment variables for convenience
export const {
  NODE_ENV,
  PORT,
  LOG_LEVEL,
  JSON_LOGGING,
  CONFIG_PATH,
  CERTS_DIR,
  ROOT_CA,
  CERT,
  PRIVATE_KEY,
  MQTT_KEEPALIVE,
  MQTT_TIMEOUT,
  AWS_REGION,
  S3_BUCKET,
  S3_PREFIX,
  CONFIG_SOURCE,
  CONFIG_NAME,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_CONFIG_TABLE,
  SUPABASE_RETRY_ATTEMPTS,
  SUPABASE_RETRY_DELAY_MS,
} = env;

type ConfigSource = "yaml" | "mongo" | "supabase";

// Configuration source flags
export const CURRENT_CONFIG_SOURCE = (CONFIG_SOURCE ?? "yaml") as ConfigSource;
export const USE_MONGO_CONFIG = CURRENT_CONFIG_SOURCE === "mongo";
export const USE_SUPABASE_CONFIG = CURRENT_CONFIG_SOURCE === "supabase";

// MongoDB configuration
export const MONGO_URI =
  process.env.MONGO_URI ?? "mongodb://localhost:27017/aeme";
export const MONGO_CONFIG_NAME = CONFIG_NAME;

// Supabase configuration
export const SUPABASE_ACTIVE_CONFIG_TABLE = SUPABASE_CONFIG_TABLE;
export const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';
