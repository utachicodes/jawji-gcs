import type { Drone } from "@/lib/drone-store"

export type Telemetry = {
  altitude: number
  speed: number
  heading: number
  battery: number
  signal: number
  temperature: number
  pitch: number
  roll: number
  yaw: number
  latitude: number
  longitude: number
  flightTime: number
  flightMode: string
  gpsCount: number
}

const EMPTY_TELEMETRY: Telemetry = {
  altitude: 0,
  speed: 0,
  heading: 0,
  battery: 0,
  signal: 0,
  temperature: 0,
  pitch: 0,
  roll: 0,
  yaw: 0,
  latitude: 0,
  longitude: 0,
  flightTime: 0,
  flightMode: "N/A",
  gpsCount: 0,
}

export function deriveTelemetry(drone?: Drone | null): Telemetry {
  if (!drone) return EMPTY_TELEMETRY
  const altitude = drone.location?.altitude ?? 0
  const latitude = drone.location?.lat ?? 0
  const longitude = drone.location?.lng ?? 0
  const flightTime =
    typeof drone.flightTime === "number"
      ? Math.max(0, Math.round(drone.flightTime))
      : drone.lastSeen
        ? Math.max(0, Math.round((Date.now() - new Date(drone.lastSeen).getTime()) / 1000))
        : 0

  return {
    altitude,
    speed: drone.speed ?? 0,
    heading: drone.heading ?? drone.yaw ?? 0,
    battery: Math.max(0, Math.min(100, drone.battery)),
    signal: Math.max(0, Math.min(100, drone.signal)),
    temperature: drone.temperature ?? 0,
    pitch: drone.pitch ?? 0,
    roll: drone.roll ?? 0,
    yaw: drone.yaw ?? drone.heading ?? 0,
    latitude,
    longitude,
    flightTime,
    flightMode: drone.mode || "N/A",
    gpsCount: drone.gpsCount ?? 14, // Default to 14 for "good" lock if undefined
  }
}
