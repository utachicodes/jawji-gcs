/**
 * Common type definitions used across the application
 */

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
      rate: number; // milliseconds
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

export interface MQTTMessage {
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
}

export interface ProcessedMessage {
  topic: string;
  timestamp: string;
  data: any;
}

export interface StreamPayload {
  timestamp: string;
  platformDeviceId: string;
  routineId: string;
  data: ProcessedMessage[];
  metadata?: DeviceMetadata;
}

export interface Stats {
  messages_received: number;
  batches_sent: number;
  messages_sent: number;
  errors: number;
  last_batch_time: string | null;
  last_error: string | null;
  queue_size: number;
  status: StreamStatus;
}

export enum StreamStatus {
  RUNNING = "running",
  PAUSED = "paused",
  STOPPED = "stopped",
}

export interface ServiceStats {
  uptime: string;
  devices: number;
  timestamp: string;
}

export interface SystemStatus {
  service: ServiceStats;
  devices: Record<string, Stats>;
}
