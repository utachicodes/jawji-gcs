import mqtt from "mqtt"
import { publishTelemetry } from "./telemetry-pubsub"

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883"
const TOPIC_PATTERN = "drone/+/telemetry"
const COMMAND_TOPIC_PREFIX = "drone"

let client: mqtt.MqttClient | null = null

export function initMqttClient() {
    if (client) {
        console.log("[MQTT] Client already initialized")
        return
    }

    console.log(`[MQTT] Initializing client... Connecting to ${MQTT_BROKER_URL}...`)

    client = mqtt.connect(MQTT_BROKER_URL, {
        reconnectPeriod: 5000,
    })

    client.on("connect", () => {
        console.log("[MQTT] Connected")
        client?.subscribe(TOPIC_PATTERN, (err) => {
            if (err) {
                console.error("[MQTT] Subscribe error:", err)
            } else {
                console.log(`[MQTT] Subscribed to ${TOPIC_PATTERN}`)
            }
        })
    })

    client.on("message", (topic, message) => {
        try {
            const payload = JSON.parse(message.toString())
            console.log(`[MQTT] Message on ${topic}`)
            publishTelemetry(payload)
        } catch (err) {
            console.error("[MQTT] Parse error:", err)
        }
    })

    client.on("error", (err) => {
        console.error("[MQTT] Error:", err)
    })
}

/**
 * Send abort command to drone via MQTT
 * @param droneId - ID of the drone to abort
 * @param batteryLevel - Current battery percentage (optional, for safe mode selection)
 */
export function abortMission(droneId: string, batteryLevel?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!client || !client.connected) {
            console.error("[MQTT] Client not connected, cannot send abort command")
            reject(new Error("MQTT client not connected"))
            return
        }

        // Determine safe mode based on battery level
        const safeMode = batteryLevel && batteryLevel < 25 ? "EMERGENCY_LAND" : "RTH"

        const abortCommand = {
            command: "ABORT_MISSION",
            safeMode,
            timestamp: new Date().toISOString(),
            priority: "CRITICAL"
        }

        const topic = `${COMMAND_TOPIC_PREFIX}/${droneId}/command`

        console.log(`[MQTT] Sending abort command to ${topic}:`, abortCommand)

        client.publish(topic, JSON.stringify(abortCommand), { qos: 1 }, (err) => {
            if (err) {
                console.error("[MQTT] Failed to publish abort command:", err)
                reject(err)
            } else {
                console.log(`[MQTT] Abort command sent successfully to ${droneId}`)
                resolve(true)
            }
        })
    })
}

/**
 * Send custom command to drone via MQTT
 */
export function sendCommand(droneId: string, command: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!client || !client.connected) {
            reject(new Error("MQTT client not connected"))
            return
        }

        const topic = `${COMMAND_TOPIC_PREFIX}/${droneId}/command`

        client.publish(topic, JSON.stringify(command), { qos: 1 }, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(true)
            }
        })
    })
}

