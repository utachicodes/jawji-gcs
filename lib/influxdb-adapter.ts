/**
 * Optional InfluxDB adapter.
 * Activated only when INFLUXDB_URL env var is set.
 * Install the client if needed: npm install @influxdata/influxdb-client
 */

import type { FlightLogEntry } from "./flight-log-client"

interface InfluxWriter {
  write(data: string): void
  flush(): Promise<void>
  close(): Promise<void>
}

let writeApi: InfluxWriter | null = null

async function getWriteApi(): Promise<InfluxWriter | null> {
  const url    = process.env.INFLUXDB_URL
  const token  = process.env.INFLUXDB_TOKEN
  const org    = process.env.INFLUXDB_ORG    ?? "jawji"
  const bucket = process.env.INFLUXDB_BUCKET ?? "drone_telemetry"

  if (!url) return null

  if (writeApi) return writeApi

  try {
    // Dynamic import so that the package is optional
    const { InfluxDB } = await import("@influxdata/influxdb-client")
    const client = new InfluxDB({ url, token: token ?? "" })
    writeApi = client.getWriteApi(org, bucket, "ms")
    return writeApi
  } catch {
    // Package not installed — silently skip
    return null
  }
}

/**
 * Write flight log entries to InfluxDB (no-op when INFLUXDB_URL is not set).
 */
export async function writeEntriesToInflux(
  droneId: string,
  missionId: string | undefined,
  entries: FlightLogEntry[]
): Promise<void> {
  const api = await getWriteApi()
  if (!api) return

  const tagStr = missionId
    ? `,droneId=${droneId},missionId=${missionId}`
    : `,droneId=${droneId}`

  for (const e of entries) {
    // Line protocol: measurement,tags fields timestamp
    const line = [
      `drone_telemetry${tagStr}`,
      ` lat=${e.lat},lng=${e.lng},altitude=${e.altitude}`,
      `,speed=${e.speed},battery=${e.battery},heading=${e.heading}`,
      ` ${e.ts}`,
    ].join("")
    api.write(line)
  }

  try {
    await api.flush()
  } catch {
    // Non-fatal — telemetry loss is acceptable
  }
}
