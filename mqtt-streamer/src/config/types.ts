/**
 * Configuration type definitions and validation schemas
 */

import { z } from "zod";

// Zod schemas for runtime validation
export const DeviceMetadataSchema = z
  .object({
    zone: z.string().optional(),
    location: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  })
  .passthrough(); // Allow additional properties

export const TopicSubscriptionSchema = z.object({
  mode: z.enum(["all", "selected", "data_all"]),
  list: z.array(z.string()),
  categories: z.array(z.string()).optional(), // Filter for topic categories in data_all mode
});

export const DeviceConfigSchema = z.object({
  device_id: z.string().min(1),
  stack_name: z.string().min(1),
  thing_name: z.string().min(1),
  topics: TopicSubscriptionSchema,
  metadata: DeviceMetadataSchema.optional(),
});

export const MQTTConfigSchema = z.object({
  endpoint: z.string().min(1),
  port: z.number().min(1).max(65535).default(8883),
});

export const StreamConfigSchema = z.object({
  parameters: z.object({
    endpoint: z.string().url(),
    method: z.string().default("POST"),
    headers: z.record(z.string()).default({}),
    streaming: z.object({
      enabled: z.boolean().default(true),
      rate: z.number().min(100).default(5000), // minimum 100ms
    }),
  }),
});

export const AppConfigSchema = z.object({
  mqtt: MQTTConfigSchema,
  stream: StreamConfigSchema,
  devices: z.array(DeviceConfigSchema).min(1),
});

export const CertificatePathsSchema = z.object({
  root_ca: z.string().min(1),
  cert: z.string().min(1),
  private_key: z.string().min(1),
});

// Environment variable schema
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "DEBUG", "INFO", "WARN", "ERROR"])
    .transform((val) => val.toLowerCase())
    .default("info"),
  JSON_LOGGING: z.coerce.boolean().default(false),
  CONFIG_PATH: z.string().default("./config/streamer_config.yaml"),
  CERTS_DIR: z.string().default("./certs"),
  ROOT_CA: z.string().default("AmazonRootCA1.pem"),
  CERT: z.string().default("thing.cert.pem"),
  PRIVATE_KEY: z.string().default("thing.private.key"),
  MQTT_KEEPALIVE: z.coerce.number().default(60),
  MQTT_TIMEOUT: z.coerce.number().default(10),
  AWS_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional(),
  S3_PREFIX: z.string().optional(),
  CONFIG_SOURCE: z.enum(["yaml", "mongo", "supabase"]).default("yaml"),
  CONFIG_NAME: z.string().default("main"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_CONFIG_TABLE: z.string().default("streamer_configs"),
  SUPABASE_RETRY_ATTEMPTS: z.coerce.number().default(3),
  SUPABASE_RETRY_DELAY_MS: z.coerce.number().default(1000),
});

// TypeScript types derived from schemas - but with proper optional handling
export interface DeviceMetadata {
  zone?: string;
  location?: string;
  coordinates?: [number, number];
  [key: string]: any;
}

export interface TopicSubscription {
  mode: "all" | "selected" | "data_all";
  list: string[];
  categories?: string[]; // Filter for topic categories in data_all mode
}

export interface DeviceConfig {
  device_id: string;
  stack_name: string;
  thing_name: string;
  topics: TopicSubscription;
  metadata?: DeviceMetadata;
}

export interface MQTTConfig {
  endpoint: string;
  port: number;
}

export interface StreamConfig {
  parameters: {
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    streaming: {
      enabled: boolean;
      rate: number;
    };
  };
}

export interface AppConfig {
  mqtt: MQTTConfig;
  stream: StreamConfig;
  devices: DeviceConfig[];
}

export interface CertificatePaths {
  root_ca: string;
  cert: string;
  private_key: string;
}

export type EnvConfig = z.infer<typeof EnvSchema>;
