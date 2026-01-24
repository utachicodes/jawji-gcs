/**
 * Legacy single-device MQTT client.
 * Used by targeted unit tests to validate basic MQTT flows.
 */

import * as mqtt from "mqtt";
import * as fs from "fs";
import { DeviceConfig } from "../../types/common";
import { CertificatePaths } from "../../config/types";
import { createChildLogger } from "../../utils/logger";

type MessageHandler = (topic: string, payload: string) => void;

export class MQTTClient {
  private readonly device: DeviceConfig;
  private readonly endpoint: string;
  private readonly port: number;
  private readonly certs: CertificatePaths;
  private readonly logger: ReturnType<typeof createChildLogger>;

  private client: mqtt.MqttClient | null = null;
  private connected = false;
  private readonly messageHandlers: Set<MessageHandler> = new Set();

  constructor(
    device: DeviceConfig,
    endpoint: string,
    port: number,
    certs: CertificatePaths
  ) {
    this.device = device;
    this.endpoint = endpoint;
    this.port = port;
    this.certs = certs;
    this.logger = createChildLogger(`MQTTClient:${device.device_id}`);
  }

  /**
   * Establish MQTT connection for the device.
   */
  async connect(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    const mqttUrl = `mqtts://${this.endpoint}:${this.port}`;
    const options: mqtt.IClientOptions = {
      clientId: `${this.device.device_id}-${Date.now()}`,
      ca: fs.readFileSync(this.certs.root_ca),
      cert: fs.readFileSync(this.certs.cert),
      key: fs.readFileSync(this.certs.private_key),
      keepalive: 60,
      reconnectPeriod: 0,
      clean: true,
    };

    this.client = mqtt.connect(mqttUrl, options);

    await new Promise<void>((resolve, reject) => {
      if (!this.client) {
        reject(new Error("MQTT client not initialized"));
        return;
      }

      const cleanup = () => {
        if (!this.client) return;
        (this.client as any).off?.("connect", onConnect);
        (this.client as any).off?.("error", onError);
      };

      const onConnect = () => {
        cleanup();
        this.connected = true;
        this.logger.debug("MQTT client connected");
        resolve();
      };

      const onError = (error: Error) => {
        cleanup();
        this.logger.error("MQTT client connection error", { error });
        reject(error);
      };

      this.client.on("connect", onConnect);
      this.client.on("error", onError);
      this.client.on("message", this.handleIncomingMessage);
    });
  }

  /**
   * Disconnect MQTT client.
   */
  async disconnect(): Promise<void> {
    if (!this.client) return;

    await new Promise<void>((resolve) => {
      this.client?.end(true, undefined, () => resolve());
    });

    this.connected = false;
    this.client = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Subscribe to configured topics for the device.
   */
  async subscribeToTopics(): Promise<void> {
    this.ensureConnected();

    const topics = this.device.topics?.list || [];
    const client = this.client!;

    await Promise.all(
      topics.map(
        (topic) =>
          new Promise<void>((resolve, reject) => {
            client.subscribe(topic, { qos: 1 }, (error) => {
              if (error) {
                this.logger.warn("Subscription failed", { topic, error });
                reject(error);
              } else {
                resolve();
              }
            });
          })
      )
    );
  }

  /**
   * Send AddTopics command to activate streaming for the device.
   */
  async sendAddTopicsCommand(): Promise<void> {
    this.ensureConnected();

    const targetTopic = `${this.device.thing_name}/sub`;
    const payload = {
      type: "AddTopics",
      topic_names: this.device.topics?.list || [],
    };

    await new Promise<void>((resolve, reject) => {
      this.client!.publish(targetTopic, JSON.stringify(payload), { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Publish raw payload to a topic.
   */
  async publish(topic: string, payload: string): Promise<void> {
    this.ensureConnected();

    await new Promise<void>((resolve, reject) => {
      this.client!.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  private handleIncomingMessage = (topic: string, payload: Buffer): void => {
    const thingPrefix = `${this.device.thing_name}/`;
    const normalizedTopic = topic.startsWith(thingPrefix)
      ? topic.substring(thingPrefix.length)
      : topic;

    const payloadStr = payload.toString();

    this.messageHandlers.forEach((handler) => {
      try {
        handler(normalizedTopic, payloadStr);
      } catch (error) {
        this.logger.error("Message handler failed", { error });
      }
    });
  };

  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error("MQTT client not connected");
    }
  }
}

