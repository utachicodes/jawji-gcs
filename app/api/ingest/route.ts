import { NextRequest, NextResponse } from "next/server"
import { publishTelemetry } from "@/lib/server/telemetry-pubsub"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function buildCorsHeaders(req: NextRequest): Headers {
  const allowedOrigin = process.env.INGEST_CORS_ORIGIN || "*"
  const headers = new Headers({
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With, x-api-key",
    "Vary": "Origin",
  })
  return headers
}

function isAuthorized(req: NextRequest): boolean {
  const expectedToken = process.env.INGEST_TOKEN
  if (!expectedToken) return true
  const auth = req.headers.get("authorization")
  const apiKey = req.headers.get("x-api-key")
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() === expectedToken
  }
  if (apiKey) {
    return apiKey.trim() === expectedToken
  }
  return false
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: buildCorsHeaders(req) })
  }

  let data: unknown
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: buildCorsHeaders(req) })
  }

  const normalized = normalizePayload(data)

  try {
    const payloadSchema = telemetrySchema()
    const unionSchema = z.union([payloadSchema, z.array(payloadSchema).min(1)])
    const parsed = unionSchema.parse(normalized)

    const items = Array.isArray(parsed) ? parsed : [parsed]
    for (const item of items) {
      publishTelemetry(item)
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: buildCorsHeaders(req) })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500, headers: buildCorsHeaders(req) })
  }
}

function telemetrySchema() {
  return z
    .object({
      droneId: z.string(),
      ts: z.number().optional(),
      mode: z.string().optional(),
      status: z.enum(["online", "offline", "flying", "error"]).optional(),
      battery: z.number().min(0).max(100).optional(),
      signal: z.number().min(0).max(100).optional(),
      location: z
        .object({
          lat: z.number(),
          lng: z.number(),
          altitude: z.number().optional(),
        })
        .optional(),
      altitude: z.number().optional(),
      speed: z.number().optional(),
      heading: z.number().optional(),
      topic: z.string().optional(),
      value: z.any().optional(),
    })
    .passthrough()
}

function normalizePayload(data: unknown): unknown {
  if (Array.isArray(data)) {
    const expanded = data.flatMap((item) => (isStreamerBatch(item) ? transformStreamerBatch(item) : [item]))
    return expanded
  }

  if (isStreamerBatch(data)) {
    return transformStreamerBatch(data)
  }

  return data
}

type StreamerBatch = {
  platformDeviceId: string
  timestamp?: string
  routineId?: string
  metadata?: Record<string, any>
  data?: Array<{
    topic: string
    timestamp?: string
    data?: { type?: string; data?: unknown } | unknown
  }>
}

function isStreamerBatch(value: unknown): value is StreamerBatch {
  if (!value || typeof value !== "object") return false
  const candidate = value as StreamerBatch
  return (
    typeof candidate.platformDeviceId === "string" &&
    Array.isArray(candidate.data) &&
    candidate.data.every((entry) => entry && typeof entry.topic === "string")
  )
}

function transformStreamerBatch(batch: StreamerBatch): any[] {
  const aggregate: Record<string, any> = {
    droneId: batch.platformDeviceId,
    ts: safeTimestamp(batch.timestamp),
  }

  if (batch.metadata) {
    aggregate.metadata = batch.metadata
  }

  const extras: Record<string, any> = {}
  const items: any[] = []

  let lat: number | undefined
  let lng: number | undefined
  let altitude: number | undefined

  for (const entry of batch.data || []) {
    const value = extractEntryValue(entry.data)
    const topic = entry.topic
    const topicLower = topic.toLowerCase()

    if (contains(topicLower, ["battery"])) {
      const num = toNumber(value)
      if (num !== undefined) aggregate.battery = clamp(num, 0, 100)
    } else if (contains(topicLower, ["signal", "rssi", "strength"])) {
      const num = toNumber(value)
      if (num !== undefined) aggregate.signal = clamp(num, 0, 100)
    } else if (contains(topicLower, ["status", "state"])) {
      if (typeof value === "string") {
        const normalized = value.toLowerCase()
        if (["online", "offline", "flying", "error"].includes(normalized)) {
          aggregate.status = normalized
        } else {
          aggregate.status = "online"
          extras.status = value
        }
      }
    } else if (contains(topicLower, ["mode"])) {
      if (typeof value === "string") {
        aggregate.mode = value
      }
    } else if (contains(topicLower, ["lat"])) {
      lat = toNumber(value)
    } else if (contains(topicLower, ["lng", "lon"])) {
      lng = toNumber(value)
    } else if (contains(topicLower, ["alt"])) {
      altitude = toNumber(value)
    } else if (contains(topicLower, ["speed"])) {
      const num = toNumber(value)
      if (num !== undefined) aggregate.speed = num
    } else if (contains(topicLower, ["heading", "yaw"])) {
      const num = toNumber(value)
      if (num !== undefined) aggregate.heading = num
    }

    extras[topic] = value

    items.push({
      droneId: batch.platformDeviceId,
      ts: safeTimestamp(entry.timestamp) ?? aggregate.ts,
      topic,
      value,
    })
  }

  if (lat !== undefined && lng !== undefined) {
    aggregate.location = {
      lat,
      lng,
      altitude: altitude ?? aggregate.altitude,
    }
  } else if (batch.metadata?.location) {
    aggregate.location = batch.metadata.location
  }

  if (Object.keys(extras).length > 0) {
    aggregate.extras = extras
  }

  const aggregateHasTelemetry =
    Object.keys(aggregate).some((key) => ["battery", "signal", "mode", "status", "location", "speed", "heading"].includes(key)) ||
    !!aggregate.metadata

  return aggregateHasTelemetry ? [aggregate, ...items] : items.length > 0 ? items : [aggregate]
}

function extractEntryValue(entry: StreamerBatch["data"][number]["data"]) {
  if (entry && typeof entry === "object" && "data" in entry) {
    return (entry as { data?: unknown }).data
  }
  return entry
}

function contains(target: string, tokens: string[]) {
  return tokens.some((token) => target.includes(token))
}

function toNumber(value: unknown): number | undefined {
  const num = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN
  return Number.isFinite(num) ? num : undefined
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function safeTimestamp(value?: string) {
  if (!value) return Date.now()
  const time = Date.parse(value)
  return Number.isNaN(time) ? Date.now() : time
}


