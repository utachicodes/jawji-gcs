export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Only import and run on the Node.js server side
        const { initMqttClient } = await import("./lib/server/mqtt-client")
        initMqttClient()
    }
}
