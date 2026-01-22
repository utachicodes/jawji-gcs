"use client"

import io from "socket.io-client";
import { useEffect, useState } from "react";

// Singleton socket instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let socket: any | null = null;

export const getSocket = () => {
    if (!socket) {
        // Connect to the backend - assumes backend runs on port 3001 or proxied via Next.js
        // For development, we often need to point to the specific port
        const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        socket = io(url, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true
        });
    }
    return socket;
};

export interface MqttMessage {
    deviceId: string;
    topic: string;
    payload: string;
    timestamp: number;
}

export const useSocketSubscription = (topicPattern: string, callback: (data: MqttMessage) => void) => {
    useEffect(() => {
        const socket = getSocket();

        const handler = (msg: MqttMessage) => {
            // Simple logic: if pattern is "*" or matches exact topic or regex logic
            if (topicPattern === "*" || msg.topic.includes(topicPattern)) {
                callback(msg);
            }
        };

        socket.on("mqtt_message", handler);

        return () => {
            socket.off("mqtt_message", handler);
        };
    }, [topicPattern, callback]);
};

export const publishMqttMessage = (deviceId: string, topic: string, payload: unknown) => {
    const socket = getSocket();
    // Ensure payload is stringified if object
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    socket.emit("mqtt_publish", { deviceId, topic, payload: payloadStr });
};
