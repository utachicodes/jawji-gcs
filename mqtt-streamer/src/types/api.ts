/**
 * API-specific type definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ServiceInfo {
  service: string;
  version: string;
  status: string;
  timestamp: string;
}

export interface StateCommandRequest {
  device_id: string;
  topic: string;
  state: string;
  topic_type?: string;
  additional_params?: Record<string, any>;
  qos?: number;
}

export interface StateCommandResponse {
  message: string;
  device_id: string;
  state: string;
  timestamp: string;
  topic?: string;
  command_topic?: string;
  command_type?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  details?: any;
}

export interface DeviceControlResponse {
  message: string;
  device_id: string;
  timestamp: string;
}

export interface QueueClearResponse {
  message: string;
  device_id: string;
  removed_messages: number;
  timestamp: string;
}

export interface HealthCheckResponse {
  healthy: boolean;
  services: {
    mqtt: boolean;
    stream: boolean;
    api: boolean;
  };
  timestamp: string;
}

export interface RecoveryRequest {
  device_id: string;
  start_time: string;
  end_time: string;
  bucket?: string;
  prefix?: string;
}

export interface RecoveryResponse {
  message: string;
  device_id: string;
  records_recovered: number;
  timestamp: string;
}

export interface BulkCommandItem {
  device_id: string;
  topic: string;
  state: string;
  topic_type?: string;
  additional_params?: Record<string, any>;
  qos?: number;
}

export interface BulkCommandRequest {
  commands: BulkCommandItem[];
}

export interface BulkCommandResult {
  device_id: string;
  status: 'success' | 'error';
  message: string;
  command_type?: string;
  error?: string;
}

export interface BulkCommandResponse {
  summary: {
    total: number;
    successful: number;
    failed: number;
    execution_time_ms: number;
  };
  results: BulkCommandResult[];
  timestamp: string;
}
