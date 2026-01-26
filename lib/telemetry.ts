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
  gpsSatellites: number
  homeLocation?: { lat: number; lng: number; altitude: number }
  verticalSpeed: number
  distance: number
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
  gpsSatellites: 0,
  verticalSpeed: 0,
  distance: 0,
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
    gpsSatellites: drone.gpsSatellites ?? 0,
    homeLocation: drone.homeLocation,
    verticalSpeed: drone.verticalSpeed ?? 0,
    distance: drone.homeLocation && drone.location
      ? calculateDistance(drone.homeLocation.lat, drone.homeLocation.lng, drone.location.lat, drone.location.lng)
      : 0,
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === 0 || lat2 === 0) return 0
  const R = 6371e3 // metres
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

import { useState } from "react"
export function useTelemetry() {
  const [data] = useState(EMPTY_TELEMETRY)

  // In the future this could subscribe to a websocket
  // For now it just returns empty static data
  // The Dashboard prefers the DroneStore data anyway

  return data
}
