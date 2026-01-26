import { NextRequest } from "next/server"
import { subscribeTelemetry } from "@/lib/server/telemetry-pubsub"
import { initMqttClient } from "@/lib/server/mqtt-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sseHeaders(origin: string | null): Headers {
  const allowedOrigin = process.env.INGEST_CORS_ORIGIN || "*"
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": allowedOrigin,
  })
  if (origin) headers.set("Vary", "Origin")
  return headers
}

export async function GET(req: NextRequest) {
  // Ensure MQTT client is running (lazy init fallback)
  initMqttClient()

  const encoder = new TextEncoder()
  let heartbeat: NodeJS.Timeout | null = null
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const write = (data: string) => controller.enqueue(encoder.encode(data))
      write(`event: open\ndata: ${JSON.stringify({ ok: true })}\n\n`)

      unsubscribe = subscribeTelemetry((payload) => {
        const line = `event: telemetry\ndata: ${JSON.stringify(payload)}\n\n`
        write(line)
      })

      heartbeat = setInterval(() => {
        write(`event: ping\ndata: ${Date.now()}\n\n`)
      }, 25000)
    },
    cancel() {
      if (unsubscribe) unsubscribe()
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: sseHeaders(req.headers.get("origin")),
  })
}


