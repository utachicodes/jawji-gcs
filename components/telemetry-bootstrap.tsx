"use client"

import { useEffect } from "react"
import { useDroneStore } from "@/lib/drone-store"

export function TelemetryBootstrap() {
  useEffect(() => {
    const es = new EventSource("/api/telemetry/stream")

    es.addEventListener("telemetry", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        applyUpdate(data)
      } catch {
        // ignore malformed messages
      }
    })

    return () => {
      es.close()
    }
  }, [])
  return null
}

function applyUpdate(payload: any) {
  const id = deriveIdentifier(payload)
  if (!id) return

  const {
    addDrone,
    updateDrone,
    selectDrone,
  } = useDroneStore.getState() as {
    addDrone: (drone: any) => void
    updateDrone: (id: string, updates: any) => void
    selectDrone: (id: string) => void
  }
  const { drones, selectedDrone } = useDroneStore.getState() as { drones: Array<{ id: string }>; selectedDrone: string | null }
  const exists = drones.some((d) => d.id === id)

  const location = deriveLocation(payload)
  const telemetryPatch = buildTelemetryPatch(payload, location)

  if (!exists) {
    addDrone({
      id,
      name: payload.name || id,
      model: payload.model || payload.metadata?.model || "Unknown",
      status: telemetryPatch.status || "online",
      mode: telemetryPatch.mode || "AUTO",
      battery: telemetryPatch.battery ?? 100,
      signal: telemetryPatch.signal ?? 100,
      location,
      speed: telemetryPatch.speed,
      heading: telemetryPatch.heading,
      pitch: telemetryPatch.pitch,
      roll: telemetryPatch.roll,
      yaw: telemetryPatch.yaw,
      temperature: telemetryPatch.temperature,
      flightTime: telemetryPatch.flightTime,
      videoUrl: telemetryPatch.videoUrl,
      extras: telemetryPatch.extras,
    })
    if (!selectedDrone) {
      selectDrone(id)
    }
  } else {
    updateDrone(id, telemetryPatch)
  }
}

function deriveIdentifier(payload: any): string | null {
  if (typeof payload?.droneId === "string") return payload.droneId
  if (typeof payload?.platformDeviceId === "string") return payload.platformDeviceId
  if (typeof payload?.id === "string") return payload.id
  return null
}

function deriveLocation(payload: any) {
  const lat = toNumber(payload?.location?.lat ?? payload?.lat)
  const lng = toNumber(payload?.location?.lng ?? payload?.lng)
  const altitude = toNumber(payload?.location?.altitude ?? payload?.altitude)

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return undefined
  return {
    lat,
    lng,
    altitude: isFiniteNumber(altitude) ? altitude : 0,
  }
}

function buildTelemetryPatch(payload: any, location?: { lat: number; lng: number; altitude: number }) {
  const patch: Record<string, unknown> = {}
  if (typeof payload.status === "string") patch.status = payload.status
  if (typeof payload.mode === "string") patch.mode = payload.mode
  const battery = toNumber(payload.battery)
  if (isFiniteNumber(battery)) patch.battery = clamp(battery, 0, 100)
  const signal = toNumber(payload.signal)
  if (isFiniteNumber(signal)) patch.signal = clamp(signal, 0, 100)
  const speed = toNumber(payload.speed ?? payload.velocity)
  if (isFiniteNumber(speed)) patch.speed = speed
  const heading = toNumber(payload.heading ?? payload.yaw)
  if (isFiniteNumber(heading)) patch.heading = heading
  const pitch = toNumber(payload.pitch ?? payload.attitude?.pitch)
  if (isFiniteNumber(pitch)) patch.pitch = pitch
  const roll = toNumber(payload.roll ?? payload.attitude?.roll)
  if (isFiniteNumber(roll)) patch.roll = roll
  const yaw = toNumber(payload.yaw ?? payload.heading)
  if (isFiniteNumber(yaw)) patch.yaw = yaw
  const temperature = toNumber(payload.temperature ?? payload.env?.temperature)
  if (isFiniteNumber(temperature)) patch.temperature = temperature
  const flightTime = toNumber(payload.flightTime)
  if (isFiniteNumber(flightTime)) {
    patch.flightTime = Math.max(0, Math.round(flightTime))
  } else if (typeof payload.ts === "number") {
    const delta = Math.max(0, Date.now() - payload.ts)
    patch.flightTime = Math.round(delta / 1000)
  }
  if (location) {
    patch.location = location
  } else {
    const altitudeOnly = toNumber(payload.altitude)
    if (isFiniteNumber(altitudeOnly)) {
      patch.location = {
        lat: Number.NaN,
        lng: Number.NaN,
        altitude: altitudeOnly,
      }
    }
  }
  const videoUrl = deriveVideoUrl(payload)
  if (videoUrl) {
    patch.videoUrl = videoUrl
  }
  if (payload.extras && typeof payload.extras === "object") {
    patch.extras = payload.extras
  }
  return patch
}

function deriveVideoUrl(payload: any): string | undefined {
  const candidate =
    payload.videoUrl ||
    payload.streamUrl ||
    payload.media?.liveFeed ||
    payload.media?.streamUrl ||
    payload.metadata?.videoUrl ||
    payload.metadata?.cameraFeed ||
    payload.metadata?.camera?.streamUrl
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate.trim()
  }
  return undefined
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}
