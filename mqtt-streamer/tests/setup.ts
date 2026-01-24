/**
 * Simple test setup
 */

// Test environment
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error";

// Mock file system
jest.mock("fs", () => ({
  readFileSync: jest.fn(() => Buffer.from("mock-cert-data")),
  existsSync: jest.fn(() => true),
}));

// Mock MQTT
jest.mock("mqtt", () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    publish: jest.fn(
      (_topic: string, _payload: string, _options: any, callback: Function) => {
        setImmediate(() => callback());
      }
    ),
    subscribe: jest.fn((_topic: string, _options: any, callback: Function) => {
      setImmediate(() => callback());
    }),
    end: jest.fn((_force: boolean, _options: any, callback: Function) => {
      setImmediate(() => callback());
    }),
  })),
}));

// Mock axios
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ status: 200 })),
}));

// Test data
export const mockDevice = {
  device_id: "test-device",
  stack_name: "test-stack",
  thing_name: "test-thing",
  topics: {
    mode: "selected" as const,
    list: ["test/topic1", "test/topic2"],
  },
};

export const mockConfig = {
  mqtt: {
    endpoint: "test.amazonaws.com",
    port: 8883,
  },
  stream: {
    parameters: {
      endpoint: "https://test.api.com/ingest",
      headers: { "Content-Type": "application/json" },
      streaming: { enabled: true, rate: 1000 },
    },
  },
  devices: [mockDevice],
};

export const mockCerts = {
  root_ca: "/test/root.pem",
  cert: "/test/cert.pem",
  private_key: "/test/key.pem",
};
