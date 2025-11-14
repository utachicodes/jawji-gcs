/**
 * Multi-Device MQTT Client with Automatic Connection Pooling
 * 
 * Features:
 * - Manages multiple devices from a single client instance
 * - Automatic connection pooling (1 connection per 50 topics)
 * - Topic discovery via thing_name/topics subscription
 * - Robust error handling and reconnection
 */

import * as mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import { createChildLogger } from "../../utils/logger";
import { DeviceConfig } from "../../types/common";
import { CertificatePaths } from "../../config/types";
import { DeviceHealthMonitor, HealthMonitorConfig } from "./health-monitor";

export interface DeviceTopicDiscovery {
  deviceId: string;
  thingName: string;
  topics: string[];
  discoveryComplete: boolean;
}

export interface ConnectionInfo {
  connectionId: string;
  client: mqtt.MqttClient;
  deviceId: string;
  thingName: string;
  subscribedTopics: string[];
  connected: boolean;
  messagesReceived: number;
}

export interface MultiDeviceStats {
  totalDevices: number;
  totalConnections: number;
  connectedConnections: number;
  devicesReady: number;
  totalTopicsDiscovered: number;
  totalMessagesReceived: number;
  devices: {
    [deviceId: string]: {
      thingName: string;
      connections: number;
      topicsDiscovered: number;
      topicsSubscribed: number;
      messagesReceived: number;
      status: 'discovering' | 'ready' | 'error';
    };
  };
}

export class MultiDeviceMQTTClient {
  private readonly mqttEndpoint: string;
  private readonly mqttPort: number;
  private readonly certs: CertificatePaths;
  private readonly logger: ReturnType<typeof createChildLogger>;
  
  // Device management
  private readonly devices: Map<string, DeviceConfig> = new Map();
  private readonly deviceDiscovery: Map<string, DeviceTopicDiscovery> = new Map();
  
  // Connection pooling
  private readonly connections: Map<string, ConnectionInfo> = new Map();
  private readonly deviceConnections: Map<string, string[]> = new Map(); // deviceId -> connectionIds[]
  
  // Message handling
  private readonly messageHandlers: Set<(deviceId: string, topic: string, payload: string) => void> = new Set();
  
  // Health monitoring
  private readonly healthMonitor: DeviceHealthMonitor;
  
  // Constants
  private readonly MAX_TOPICS_PER_CONNECTION = 50;
  private readonly DISCOVERY_TIMEOUT_MS = 30000;

  constructor(
    mqttEndpoint: string,
    mqttPort: number,
    certs: CertificatePaths,
    healthConfig?: Partial<HealthMonitorConfig>
  ) {
    this.mqttEndpoint = mqttEndpoint;
    this.mqttPort = mqttPort;
    this.certs = certs;
    this.logger = createChildLogger("MultiDeviceMQTTClient");
    
    // Initialize health monitor
    this.healthMonitor = new DeviceHealthMonitor(healthConfig);
    
    // Set re-initialization callback
    this.healthMonitor.setReinitCallback(async (config) => {
      await this.initializeDevice(config);
    });
  }

  /**
   * Initialize all devices with connection pooling
   */
  async initialize(deviceConfigs: DeviceConfig[]): Promise<void> {
    this.logger.info("Initializing multi-device MQTT client", {
      device_count: deviceConfigs.length
    });

    // Store device configurations and register with health monitor
    for (const config of deviceConfigs) {
      this.devices.set(config.device_id, config);
      this.deviceDiscovery.set(config.device_id, {
        deviceId: config.device_id,
        thingName: config.thing_name,
        topics: [],
        discoveryComplete: false
      });
      
      // Register device for health monitoring
      this.healthMonitor.registerDevice(config);
    }

    // Initialize devices with staggered timing
    for (let i = 0; i < deviceConfigs.length; i++) {
      const config = deviceConfigs[i];
      if (!config) continue;

      const delay = i * 2000; // 2 second stagger
      
      setTimeout(async () => {
        try {
          await this.initializeDevice(config);
          // Mark device as ready in health monitor
          this.healthMonitor.markDeviceReady(config.device_id);
        } catch (error) {
          this.logger.error("Failed to initialize device", {
            device_id: config.device_id,
            error
          });
          // Mark device as failed - will trigger exponential backoff retry
          this.healthMonitor.markDeviceFailed(config.device_id, error as Error);
        }
      }, delay);
    }

    // Wait for all devices to be initialized
    await this.waitForInitialization(deviceConfigs.length);
    
    // Start periodic health checks
    this.healthMonitor.startHealthChecks();
    
    this.logger.info("Multi-device MQTT client initialized", this.getStats());
  }

  /**
   * Initialize a single device
   */
  private async initializeDevice(config: DeviceConfig): Promise<void> {
    this.logger.info("=== INITIALIZING DEVICE ===", {
      device_id: config.device_id,
      thing_name: config.thing_name,
      mode: config.topics.mode
    });

    try {
      // Step 1: Create discovery connection
      this.logger.info("Step 1: Creating discovery connection");
      const discoveryConn = await this.createDiscoveryConnection(config);
      
      // Step 2: Subscribe to topics endpoint to discover available topics
      this.logger.info("Step 2: Subscribing to topics discovery endpoint");
      await this.subscribeToTopicsDiscovery(discoveryConn, config);
      
      // Step 3: Wait for topic discovery
      this.logger.info("Step 3: Waiting for topic discovery");
      const discoveredTopics = await this.waitForTopicDiscovery(config.device_id);
      
      this.logger.info("Step 3: ✅ Topics discovered", {
        count: discoveredTopics.length,
        sample: discoveredTopics.slice(0, 5)
      });
      
      // Step 4: Create connection pool and send AddTopics per connection
      this.logger.info("Step 4: Creating connection pool for data subscriptions");
      await this.createConnectionPoolForDevice(config, discoveredTopics);
      
      this.logger.info("=== DEVICE INITIALIZATION COMPLETE ===", {
        device_id: config.device_id,
        connections: this.deviceConnections.get(config.device_id)?.length || 0,
        topics: discoveredTopics.length,
        status: "✅ READY"
      });
      
    } catch (error) {
      this.logger.error("=== DEVICE INITIALIZATION FAILED ===", {
        device_id: config.device_id,
        error
      });
      throw error;
    }
  }

  /**
   * Create initial discovery connection
   */
  private async createDiscoveryConnection(config: DeviceConfig): Promise<ConnectionInfo> {
    const connectionId = `${config.device_id}-discovery-${uuidv4().substring(0, 8)}`;
    
    const client = await this.createMQTTConnection(
      connectionId,
      config.thing_name,
      config.device_id
    );

    const connInfo: ConnectionInfo = {
      connectionId,
      client,
      deviceId: config.device_id,
      thingName: config.thing_name,
      subscribedTopics: [],
      connected: true,
      messagesReceived: 0
    };

    this.connections.set(connectionId, connInfo);
    
    // Initialize device connections array
    if (!this.deviceConnections.has(config.device_id)) {
      this.deviceConnections.set(config.device_id, []);
    }
    this.deviceConnections.get(config.device_id)!.push(connectionId);

    return connInfo;
  }

  /**
   * Create MQTT connection
   */
  private async createMQTTConnection(
    clientId: string,
    thingName: string,
    deviceId: string
  ): Promise<mqtt.MqttClient> {
    return new Promise((resolve, reject) => {
      const mqttUrl = `mqtts://${this.mqttEndpoint}:${this.mqttPort}`;

      const client = mqtt.connect(mqttUrl, {
        clientId,
        ca: fs.readFileSync(this.certs.root_ca),
        cert: fs.readFileSync(this.certs.cert),
        key: fs.readFileSync(this.certs.private_key),
        keepalive: 60,
        connectTimeout: 10000,
        reconnectPeriod: 1000,
        clean: true,
        resubscribe: false,
        will: {
          topic: `${thingName}/connection`,
          payload: JSON.stringify({
            status: "disconnected",
            timestamp: new Date().toISOString(),
            clientId,
            deviceId
          }),
          qos: 1,
          retain: true
        }
      });

      client.on("connect", () => {
        this.logger.info("MQTT connection established", {
          client_id: clientId,
          device_id: deviceId
        });
        resolve(client);
      });

      client.on("error", (error) => {
        this.logger.error("MQTT connection error", {
          client_id: clientId,
          error: error.message
        });
        reject(error);
      });

      client.on("message", (topic, payload) => {
        this.handleMessage(deviceId, thingName, topic, payload);
      });

      client.on("close", () => {
        this.logger.warn("MQTT connection closed", {
          client_id: clientId,
          device_id: deviceId
        });
      });
    });
  }

  /**
   * Subscribe to topics discovery endpoint
   */
  private async subscribeToTopicsDiscovery(
    connInfo: ConnectionInfo,
    config: DeviceConfig
  ): Promise<void> {
    const topicsEndpoint = `${config.thing_name}/topics`;
    
    return new Promise((resolve, reject) => {
      connInfo.client.subscribe(topicsEndpoint, { qos: 1 }, (error, granted) => {
        if (error) {
          this.logger.error("Failed to subscribe to topics endpoint", {
            endpoint: topicsEndpoint,
            error: error.message
          });
          reject(error);
          return;
        }

        const qos = granted?.[0]?.qos;
        if (qos === 128) {
          reject(new Error("Subscription denied by broker"));
          return;
        }

        connInfo.subscribedTopics.push(topicsEndpoint);
        
        this.logger.info("Successfully subscribed to topics discovery", {
          endpoint: topicsEndpoint,
          qos
        });
        
        resolve();
      });
    });
  }

  /**
   * Send AddTopics command to activate streaming
   */
  private async sendAddTopicsCommand(
    connInfo: ConnectionInfo,
    config: DeviceConfig,
    topics: string[]
  ): Promise<void> {
    const subTopic = `${config.thing_name}/sub`;
    const payload = {
      type: "AddTopics",
      topic_names: topics,
    };
    this.logger.info("Sending AddTopics command");
    return new Promise((resolve, reject) => {
      connInfo.client.publish(
        subTopic,
        JSON.stringify(payload),
        { qos: 1 },
        (error) => {
          if (error) {
            this.logger.error("Failed to send AddTopics command", {
              connection_id: connInfo.connectionId,
              topic: subTopic,
              error: error.message
            });
            reject(error);
          } else {
            this.logger.info("AddTopics command sent successfully", {
              connection_id: connInfo.connectionId,
              topic: subTopic,
              topics_count: topics.length
            });
            resolve();
          }
        }
      );
    });
  }

  /**
   * Wait for topic discovery to complete
   */
  private async waitForTopicDiscovery(deviceId: string): Promise<string[]> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const discovery = this.deviceDiscovery.get(deviceId);
        
        if (!discovery) {
          clearInterval(checkInterval);
          reject(new Error("Device discovery info not found"));
          return;
        }

        if (discovery.discoveryComplete && discovery.topics.length > 0) {
          clearInterval(checkInterval);
          resolve(discovery.topics);
          return;
        }

        if (Date.now() - startTime > this.DISCOVERY_TIMEOUT_MS) {
          clearInterval(checkInterval);
          
          if (discovery.topics.length > 0) {
            this.logger.warn("Topic discovery timeout, using partial results", {
              device_id: deviceId,
              topics_discovered: discovery.topics.length
            });
            resolve(discovery.topics);
          } else {
            reject(new Error("Topic discovery timeout with no topics discovered"));
          }
        }
      }, 100);
    });
  }

  /**
   * Create connection pool for device based on discovered topics
   */
  private async createConnectionPoolForDevice(
    config: DeviceConfig,
    topics: string[]
  ): Promise<void> {
    // Calculate number of connections needed
    const connectionsNeeded = Math.ceil(topics.length / this.MAX_TOPICS_PER_CONNECTION);
    
    this.logger.info("Creating connection pool", {
      device_id: config.device_id,
      total_topics: topics.length,
      connections_needed: connectionsNeeded,
      topics_per_connection: this.MAX_TOPICS_PER_CONNECTION
    });

    // Split topics into chunks
    const topicChunks: string[][] = [];
    for (let i = 0; i < topics.length; i += this.MAX_TOPICS_PER_CONNECTION) {
      topicChunks.push(topics.slice(i, i + this.MAX_TOPICS_PER_CONNECTION));
    }

    // Create a connection for each chunk
    for (let i = 0; i < topicChunks.length; i++) {
      const chunk = topicChunks[i];
      if (!chunk || chunk.length === 0) continue;

      const connectionId = `${config.device_id}-data-${i}-${uuidv4().substring(0, 8)}`;
      
      this.logger.info(`Creating data connection ${i + 1}/${topicChunks.length}`, {
        connection_id: connectionId,
        topics_in_chunk: chunk.length
      });

      try {
        const client = await this.createMQTTConnection(
          connectionId,
          config.thing_name,
          config.device_id
        );

        const connInfo: ConnectionInfo = {
          connectionId,
          client,
          deviceId: config.device_id,
          thingName: config.thing_name,
          subscribedTopics: [],
          connected: true,
          messagesReceived: 0
        };

        // Subscribe to topics in this chunk
        await this.subscribeToTopicList(connInfo, chunk);
        
        this.connections.set(connectionId, connInfo);
        this.deviceConnections.get(config.device_id)!.push(connectionId);

        this.logger.info(`Data connection ${i + 1}/${topicChunks.length} subscribed`, {
          connection_id: connectionId,
          subscribed_topics: chunk.length
        });

        // Send AddTopics command for this connection's topics
        try {
          await this.sendAddTopicsCommand(connInfo, config, chunk);
          this.logger.info(`Data connection ${i + 1}/${topicChunks.length} ready`, {
            connection_id: connectionId,
            addtopics_sent: true
          });
        } catch (error) {
          this.logger.error(`Failed to send AddTopics for connection ${i + 1}`, {
            connection_id: connectionId,
            error
          });
        }

        // Small delay between connections
        if (i < topicChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        this.logger.error(`Failed to create data connection ${i + 1}`, {
          connection_id: connectionId,
          error
        });
      }
    }
  }

  /**
   * Subscribe to a list of topics on a connection
   */
  private async subscribeToTopicList(
    connInfo: ConnectionInfo,
    topics: string[]
  ): Promise<void> {
    const results = await Promise.allSettled(
      topics.map(topic => this.subscribeToTopic(connInfo, topic))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.info("Batch subscription completed", {
      connection_id: connInfo.connectionId,
      total: topics.length,
      successful,
      failed,
      success_rate: Math.round((successful / topics.length) * 100)
    });

    if (successful === 0) {
      throw new Error("All topic subscriptions failed");
    }
  }

  /**
   * Subscribe to a single topic
   */
  private async subscribeToTopic(
    connInfo: ConnectionInfo,
    topic: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      connInfo.client.subscribe(topic, { qos: 1 }, (error, granted) => {
        if (error) {
          this.logger.debug("Topic subscription failed", {
            topic,
            error: error.message
          });
          reject(error);
          return;
        }

        const qos = granted?.[0]?.qos;
        if (qos === 128) {
          reject(new Error("Subscription denied"));
          return;
        }

        connInfo.subscribedTopics.push(topic);
        resolve();
      });
    });
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(
    deviceId: string,
    thingName: string,
    topic: string,
    payload: Buffer
  ): void {
    try {
      const payloadStr = payload.toString();

      // Check if this is a topic discovery message
      if (topic === `${thingName}/topics`) {
        const discovery = this.deviceDiscovery.get(deviceId);
        
        // Only process if discovery is not yet complete
        if (discovery && !discovery.discoveryComplete) {
          this.handleTopicDiscoveryMessage(deviceId, payloadStr);
        } else {
          // Discovery already complete, ignore subsequent messages
          this.logger.debug("Ignoring duplicate topic discovery message", {
            device_id: deviceId,
            discovery_complete: discovery?.discoveryComplete
          });
        }
        return;
      }

      // Update message count
      const deviceConnIds = this.deviceConnections.get(deviceId) || [];
      for (const connId of deviceConnIds) {
        const conn = this.connections.get(connId);
        if (conn && conn.subscribedTopics.includes(topic)) {
          conn.messagesReceived++;
          break;
        }
      }

      // Extract actual topic (remove thing_name prefix)
      const actualTopic = topic.startsWith(`${thingName}/`) 
        ? topic.substring(thingName.length + 1)
        : topic;

      // Call message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(deviceId, actualTopic, payloadStr);
        } catch (error) {
          this.logger.error("Message handler error", {
            device_id: deviceId,
            topic: actualTopic,
            error
          });
        }
      });

    } catch (error) {
      this.logger.error("Error handling message", {
        device_id: deviceId,
        topic,
        error
      });
    }
  }

  /**
   * Handle topic discovery message
   */
  private handleTopicDiscoveryMessage(deviceId: string, payload: string): void {
    try {
      // Check if already discovered - avoid reprocessing
      const discovery = this.deviceDiscovery.get(deviceId);
      if (!discovery) return;
      
      if (discovery.discoveryComplete) {
        // Already discovered, ignore subsequent messages
        return;
      }

      const data = JSON.parse(payload);
      let topicList: string[] = [];

      // Parse topic list from various formats
      if (Array.isArray(data)) {
        topicList = data.filter(item => typeof item === 'string');
      } else if (typeof data === 'object' && data !== null) {
        // Check for nested arrays (categorized topics)
        const hasArrayValues = Object.values(data).some(value => Array.isArray(value));
        
        if (hasArrayValues) {
          for (const topics of Object.values(data)) {
            if (Array.isArray(topics)) {
              topicList.push(...topics.filter((item: any) => typeof item === 'string'));
            }
          }
        } else if (data.topics && Array.isArray(data.topics)) {
          topicList = data.topics.filter((item: any) => typeof item === 'string');
        } else {
          topicList = Object.keys(data);
        }
      }

      if (topicList.length === 0) {
        this.logger.warn("No topics found in discovery message", {
          device_id: deviceId,
          payload_preview: payload.substring(0, 200)
        });
        return;
      }

      const thingName = discovery.thingName;
      const fullTopics = topicList.map(topic => {
        return topic;
      });

      discovery.topics = fullTopics;
      discovery.discoveryComplete = true;

      this.logger.info("Topics discovered - unsubscribing from discovery endpoint", {
        device_id: deviceId,
        total_topics: fullTopics.length,
        sample_topics: fullTopics.slice(0, 5)
      });

      // Unsubscribe from topics endpoint to stop receiving discovery messages
      this.unsubscribeFromTopicsDiscovery(deviceId, thingName);

    } catch (error) {
      this.logger.error("Failed to parse topic discovery message", {
        device_id: deviceId,
        error,
        payload_preview: payload.substring(0, 100)
      });
    }
  }

  /**
   * Unsubscribe from topics discovery endpoint
   */
  private unsubscribeFromTopicsDiscovery(deviceId: string, thingName: string): void {
    const topicsEndpoint = `${thingName}/topics`;
    const connIds = this.deviceConnections.get(deviceId);
    
    if (!connIds || connIds.length === 0) return;

    // Find the discovery connection (first one)
    const discoveryConnId = connIds[0];
    if (!discoveryConnId) return;

    const connInfo = this.connections.get(discoveryConnId);
    if (!connInfo) return;

    connInfo.client.unsubscribe(topicsEndpoint, (error) => {
      if (error) {
        this.logger.warn("Failed to unsubscribe from topics endpoint", {
          device_id: deviceId,
          endpoint: topicsEndpoint,
          error: error.message
        });
      } else {
        this.logger.info("Unsubscribed from topics discovery endpoint", {
          device_id: deviceId,
          endpoint: topicsEndpoint
        });
        
        // Remove from subscribed topics list
        const index = connInfo.subscribedTopics.indexOf(topicsEndpoint);
        if (index > -1) {
          connInfo.subscribedTopics.splice(index, 1);
        }
      }
    });
  }

  /**
   * Wait for all devices to be initialized
   */
  private async waitForInitialization(deviceCount: number): Promise<void> {
    const maxWaitTime = 60000; // 60 seconds
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const readyDevices = Array.from(this.deviceDiscovery.values())
          .filter(d => d.discoveryComplete).length;

        if (readyDevices === deviceCount) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          this.logger.warn("Initialization timeout", {
            ready_devices: readyDevices,
            total_devices: deviceCount
          });
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Add message handler
   */
  addMessageHandler(handler: (deviceId: string, topic: string, payload: string) => void): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Remove message handler
   */
  removeMessageHandler(handler: (deviceId: string, topic: string, payload: string) => void): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Publish message to device
   */
  async publish(deviceId: string, topic: string, payload: string): Promise<void> {
    const connIds = this.deviceConnections.get(deviceId);
    if (!connIds || connIds.length === 0) {
      throw new Error(`No connections found for device ${deviceId}`);
    }

    // Use first connection for publishing
    const connInfo = this.connections.get(connIds[0]!);
    if (!connInfo || !connInfo.connected) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    const fullTopic = `${connInfo.thingName}/${topic}`;

    return new Promise((resolve, reject) => {
      connInfo.client.publish(fullTopic, payload, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error("Failed to publish message", {
            device_id: deviceId,
            topic: fullTopic,
            error: error.message
          });
          reject(error);
        } else {
          this.logger.debug("Message published", {
            device_id: deviceId,
            topic: fullTopic
          });
          resolve();
        }
      });
    });
  }

  /**
   * Get statistics
   */
  getStats(): MultiDeviceStats {
    const stats: MultiDeviceStats = {
      totalDevices: this.devices.size,
      totalConnections: this.connections.size,
      connectedConnections: 0,
      devicesReady: 0,
      totalTopicsDiscovered: 0,
      totalMessagesReceived: 0,
      devices: {}
    };

    // Count connected connections
    this.connections.forEach(conn => {
      if (conn.connected) stats.connectedConnections++;
      stats.totalMessagesReceived += conn.messagesReceived;
    });

    // Aggregate device stats
    this.devices.forEach((config, deviceId) => {
      const discovery = this.deviceDiscovery.get(deviceId);
      const connIds = this.deviceConnections.get(deviceId) || [];
      
      const deviceConns = connIds
        .map(id => this.connections.get(id))
        .filter(c => c !== undefined);

      const topicsSubscribed = deviceConns.reduce(
        (sum, conn) => sum + conn.subscribedTopics.length,
        0
      );

      const messagesReceived = deviceConns.reduce(
        (sum, conn) => sum + conn.messagesReceived,
        0
      );

      const status = discovery?.discoveryComplete 
        ? 'ready' 
        : discovery ? 'discovering' : 'error';

      if (status === 'ready') stats.devicesReady++;
      if (discovery) stats.totalTopicsDiscovered += discovery.topics.length;

      stats.devices[deviceId] = {
        thingName: config.thing_name,
        connections: connIds.length,
        topicsDiscovered: discovery?.topics.length || 0,
        topicsSubscribed,
        messagesReceived,
        status
      };
    });

    return stats;
  }

  /**
   * Disconnect all connections
   */
  async disconnect(): Promise<void> {
    this.logger.info("Disconnecting all MQTT connections");

    // Stop health monitoring
    this.healthMonitor.stopHealthChecks();

    const disconnectPromises = Array.from(this.connections.values()).map(conn => {
      return new Promise<void>((resolve) => {
        conn.client.end(true, {}, () => {
          resolve();
        });
      });
    });

    await Promise.all(disconnectPromises);

    this.connections.clear();
    this.deviceConnections.clear();
    this.devices.clear();
    this.deviceDiscovery.clear();
    this.messageHandlers.clear();

    this.logger.info("All MQTT connections disconnected");
  }

  /**
   * Get device IDs
   */
  getDeviceIds(): string[] {
    return Array.from(this.devices.keys());
  }

  /**
   * Get device config
   */
  getDeviceConfig(deviceId: string): DeviceConfig | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get device health status
   */
  getDeviceHealth(deviceId: string) {
    return this.healthMonitor.getDeviceHealth(deviceId);
  }

  /**
   * Get all device health statuses
   */
  getAllDeviceHealth() {
    return this.healthMonitor.getAllDeviceHealth();
  }

  /**
   * Get health summary
   */
  getHealthSummary() {
    return this.healthMonitor.getHealthSummary();
  }

  /**
   * Force retry for a specific device
   */
  async forceDeviceRetry(deviceId: string): Promise<void> {
    return this.healthMonitor.forceRetry(deviceId);
  }
}