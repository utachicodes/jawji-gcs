import mqtt from "mqtt"
import { publishTelemetry } from "./telemetry-pubsub"

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883"
const TOPIC_PATTERN = "drone/+/telemetry"

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
