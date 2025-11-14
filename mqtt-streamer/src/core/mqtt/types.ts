/**
 * MQTT-specific type definitions
 */

import { IClientOptions } from "mqtt";
import { DeviceConfig } from "../../types/common";

export interface MQTTClientConfig extends IClientOptions {
  clientId: string;
  endpoint: string;
  port: number;
  ca: Buffer;
  cert: Buffer;
  key: Buffer;
  keepalive: number;
  connectTimeout: number;
  reconnectPeriod: number;
  clean: boolean;
}

export interface MQTTConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastConnected: string | null;
  lastDisconnected: string | null;
  connectionAttempts: number;
}

export interface MQTTClientStats {
  messagesReceived: number;
  messagesSent: number;
  connectionAttempts: number;
  lastMessageTime: string | null;
  status: MQTTConnectionStatus;
}

export interface TopicSubscription {
  topic: string;
  qos: 0 | 1 | 2;
  subscribed: boolean;
  subscriptionTime: string | null;
}

export interface AddTopicsMessage {
  type: "AddTopics";
  sender_id: string;
  topic_names: string[];
  topic_types: string[];
  topic_rates: number[];
}

export interface MQTTMessageHandler {
  (topic: string, payload: Buffer, packet: any): void;
}

export interface MQTTClientInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(
    topic: string,
    payload: string | Buffer,
    qos?: 0 | 1 | 2
  ): Promise<void>;
  subscribe(topic: string, qos?: 0 | 1 | 2): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
  isConnected(): boolean;
  getStats(): MQTTClientStats;
  onMessage(handler: MQTTMessageHandler): void;
  removeMessageHandler(handler: MQTTMessageHandler): void;
}

export interface MQTTManagerInterface {
  initialize(): Promise<void>;
  getClient(deviceId: string): MQTTClientInterface | null;
  getAllClients(): Map<string, MQTTClientInterface>;
  getClientStats(deviceId: string): MQTTClientStats | null;
  getAllStats(): Record<string, MQTTClientStats>;
  shutdown(): Promise<void>;
}

export interface DeviceClientMapping {
  deviceId: string;
  deviceConfig: DeviceConfig;
  client: MQTTClientInterface;
  subscriptions: Map<string, TopicSubscription>;
}
