/**
 * MongoDB model for MQTT Streamer Configuration
 * Collection name: mqtt-streamer-config
 */

import mongoose, { Schema, Document } from "mongoose";

// Device Metadata interface
interface IDeviceMetadata {
  zone?: string;
  location?: string;
  coordinates?: [number, number];
  [key: string]: any;
}

// Topic Subscription interface
interface ITopicSubscription {
  mode: "all" | "selected" | "data_all";
  list: string[];
  categories?: string[];
}

// Device Configuration interface
export interface IDeviceConfig {
  device_id: string;
  stack_name: string;
  thing_name: string;
  topics: ITopicSubscription;
  metadata?: IDeviceMetadata;
}

// MQTT Configuration interface
interface IMQTTConfig {
  endpoint: string;
  port: number;
}

// Stream Parameters interface
interface IStreamParameters {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  streaming: {
    enabled: boolean;
    rate: number;
  };
}

// Main Streamer Configuration interface
export interface IStreamerConfig extends Document {
  name: string; // Unique identifier for this config (e.g., "main", "production")
  mqtt: IMQTTConfig;
  stream: {
    parameters: IStreamParameters;
  };
  devices: IDeviceConfig[];
  isActive: boolean; // Flag to indicate which config to use
  createdAt: Date;
  updatedAt: Date;
}

// Device Metadata Schema
const DeviceMetadataSchema = new Schema(
  {
    zone: { type: String, required: false },
    location: { type: String, required: false },
    coordinates: {
      type: [Number],
      required: false,
      validate: {
        validator: (v: number[]) => v.length === 2,
        message: "Coordinates must be [longitude, latitude]",
      },
    },
  },
  { strict: false, _id: false }
);

// Topic Subscription Schema
const TopicSubscriptionSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["all", "selected", "data_all"],
      required: true,
    },
    list: { type: [String], default: [] },
    categories: { type: [String], required: false },
  },
  { _id: false }
);

// Device Configuration Schema
const DeviceConfigSchema = new Schema(
  {
    device_id: { type: String, required: true },
    stack_name: { type: String, required: true },
    thing_name: { type: String, required: true },
    topics: { type: TopicSubscriptionSchema, required: true },
    metadata: { type: DeviceMetadataSchema, required: false },
  },
  { _id: false }
);

// Main Streamer Configuration Schema
const StreamerConfigSchema = new Schema<IStreamerConfig>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mqtt: {
      endpoint: { type: String, required: true },
      port: { type: Number, required: false, default: 8883, min: 1, max: 65535 },
    },
    stream: {
      parameters: {
        endpoint: { type: String, required: true },
        method: { type: String, required: false, default: "POST" },
        headers: { 
          type: Map, 
          of: String, 
          default: () => new Map([["x-api-token", ""]]),
        },
        streaming: {
          enabled: { type: Boolean, required: false, default: true },
          rate: { type: Number, required: false, default: 5000, min: 100 },
        },
      },
    },
    devices: {
      type: [DeviceConfigSchema],
      required: true,
      validate: {
        validator: (v: IDeviceConfig[]) => v.length > 0,
        message: "At least one device must be configured",
      },
    },
    isActive: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: "MqttStreamerConfig",
  }
);

// Ensure only one active config at a time
StreamerConfigSchema.pre("save", async function (next) {
  if (this.isActive) {
    await StreamerConfigModel.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
export const StreamerConfigModel = mongoose.model<IStreamerConfig>(
  "StreamerConfig",
  StreamerConfigSchema
);
