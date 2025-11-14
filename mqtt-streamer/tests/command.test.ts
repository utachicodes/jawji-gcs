/**
 * Command handler core tests
 */

import { CommandHandler } from "../src/core/command/handler";
import { mockDevice } from "./setup";

describe("CommandHandler", () => {
  let commandHandler: CommandHandler;
  let mockMqttManager: any;

  beforeEach(() => {
    mockMqttManager = {
      getDeviceConfig: jest.fn().mockReturnValue(mockDevice),
      getStats: jest.fn().mockReturnValue({
        devices: {
          "test-device": {
            status: "ready",
          },
        },
      }),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    commandHandler = new CommandHandler(mockMqttManager);
  });

  test("processes state command", async () => {
    const request = {
      device_id: "test-device",
      topic: "light/state",
      state: "ON",
    };

    const result = await commandHandler.processCommand(request);

    expect(mockMqttManager.publish).toHaveBeenCalledWith(
      "test-device",
      "sub",
      expect.stringContaining('"type":"CMD"')
    );

    expect(result).toEqual({
      message: "Command sent successfully",
      device_id: "test-device",
      state: "ON",
      topic: "test-thing/sub",
      command_type: "state_to_command",
      timestamp: expect.any(String),
    });
  });

  test("processes direct command", async () => {
    const request = {
      device_id: "test-device",
      topic: "light/command",
      state: "ON",
    };

    const result = await commandHandler.processCommand(request);

    expect(mockMqttManager.publish).toHaveBeenCalledWith(
      "test-device",
      "light/command",
      "ON"
    );

    expect(result.command_type).toBe("direct_command");
  });

  test("validates request parameters", () => {
    const invalidRequest = {
      device_id: "",
      topic: "light/state",
      state: "ON",
    };

    expect(() => commandHandler.validateRequest(invalidRequest)).toThrow(
      "device_id is required"
    );
  });

  test("handles device not found", async () => {
    mockMqttManager.getDeviceConfig.mockReturnValue(undefined);

    const request = {
      device_id: "unknown-device",
      topic: "light/state",
      state: "ON",
    };

    await expect(commandHandler.processCommand(request)).rejects.toThrow(
      "Device unknown-device not found"
    );
  });

  test("handles client not connected", async () => {
    mockMqttManager.getStats.mockReturnValue({
      devices: {
        "test-device": { status: "discovering" },
      },
    });

    const request = {
      device_id: "test-device",
      topic: "light/state",
      state: "ON",
    };

    await expect(commandHandler.processCommand(request)).rejects.toThrow(
      "Device test-device not connected"
    );
  });
});
