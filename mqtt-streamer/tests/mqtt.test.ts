/**
 * MQTT client core tests
 */

import { MQTTClient } from "../src/core/mqtt/client";
import { mockDevice, mockCerts } from "./setup";
import * as mqtt from "mqtt";

const mockMqttClient = mqtt.connect as jest.MockedFunction<typeof mqtt.connect>;

describe("MQTTClient", () => {
  let client: MQTTClient;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      on: jest.fn(),
      publish: jest.fn(
        (
          _topic: string,
          _payload: string,
          _options: any,
          callback: Function
        ) => {
          setImmediate(() => callback());
        }
      ),
      subscribe: jest.fn(
        (_topic: string, _options: any, callback: Function) => {
          setImmediate(() => callback());
        }
      ),
      end: jest.fn((_force: boolean, _options: any, callback: Function) => {
        setImmediate(() => callback());
      }),
    };

    mockMqttClient.mockReturnValue(mockClient);

    client = new MQTTClient(mockDevice, "test.amazonaws.com", 8883, mockCerts);
  });

  test("connects successfully", async () => {
    const connectPromise = client.connect();

    // Trigger connect event
    const connectHandler = mockClient.on.mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];
    if (connectHandler) connectHandler();

    await connectPromise;

    expect(client.isConnected()).toBe(true);
  });

  test("sends AddTopics command", async () => {
    // Connect first
    const connectPromise = client.connect();
    const connectHandler = mockClient.on.mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];
    if (connectHandler) connectHandler();
    await connectPromise;

    await client.sendAddTopicsCommand();

    expect(mockClient.publish).toHaveBeenCalledWith(
      "test-thing/sub",
      expect.stringContaining("AddTopics"),
      { qos: 1 },
      expect.any(Function)
    );
  });

  test("subscribes to topics", async () => {
    // Connect first
    const connectPromise = client.connect();
    const connectHandler = mockClient.on.mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];
    if (connectHandler) connectHandler();
    await connectPromise;

    await client.subscribeToTopics();

    expect(mockClient.subscribe).toHaveBeenCalledTimes(2);
    expect(mockClient.subscribe).toHaveBeenCalledWith(
      "test/topic1",
      { qos: 1 },
      expect.any(Function)
    );
    expect(mockClient.subscribe).toHaveBeenCalledWith(
      "test/topic2",
      { qos: 1 },
      expect.any(Function)
    );
  });

  test("publishes messages", async () => {
    // Connect first
    const connectPromise = client.connect();
    const connectHandler = mockClient.on.mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];
    if (connectHandler) connectHandler();
    await connectPromise;

    await client.publish("test/topic", "test payload");

    expect(mockClient.publish).toHaveBeenCalledWith(
      "test/topic",
      "test payload",
      { qos: 1 },
      expect.any(Function)
    );
  });

  test("handles incoming messages", async () => {
    const handler = jest.fn();
    client.addMessageHandler(handler);

    // Connect first
    const connectPromise = client.connect();
    const connectHandler = mockClient.on.mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];
    if (connectHandler) connectHandler();
    await connectPromise;

    // Simulate incoming message
    const messageHandler = mockClient.on.mock.calls.find(
      (call: any) => call[0] === "message"
    )?.[1];
    if (messageHandler) {
      messageHandler("test-thing/sensor/temp", Buffer.from('{"value": 25}'));
    }

    expect(handler).toHaveBeenCalledWith("sensor/temp", '{"value": 25}');
  });
});
