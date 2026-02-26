"use client"

import { useEffect, useState, useRef, useCallback } from "react"

export interface AircraftState {
  icao24: string
  callsign: string
  lat: number
  lng: number
  baro_altitude: number  // meters
  velocity: number       // m/s
  true_track: number     // heading degrees
  on_ground: boolean
}

const POLL_INTERVAL_MS = 15_000

/** Build a bounding box from a center point and radius in km. */
function buildBounds(
  lat: number,
  lng: number,
  radiusKm: number
): { lamin: number; lomin: number; lamax: number; lomax: number } {
  const degLat = radiusKm / 110.574
  const degLng = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  return {
    lamin: lat - degLat,
    lomin: lng - degLng,
    lamax: lat + degLat,
    lomax: lng + degLng,
  }
}

async function fetchAirspace(bounds: {
  lamin: number
  lomin: number
  lamax: number
  lomax: number
}): Promise<AircraftState[]> {
  const params = new URLSearchParams({
    lamin: bounds.lamin.toString(),
    lomin: bounds.lomin.toString(),
    lamax: bounds.lamax.toString(),
    lomax: bounds.lomax.toString(),
  })
  const res = await fetch(`/api/airspace?${params}`)
  if (!res.ok) throw new Error(`Airspace API ${res.status}`)
  const data = await res.json()
  return (data.states ?? []) as AircraftState[]
}

/**
 * React hook — polls the airspace API every 15 s.
 *
 * @param center    [lat, lng] center of the monitoring area
 * @param radiusKm  Radius in kilometres (default 5 km)
 */
export function useAirspace(
  center: [number, number] | null,
  radiusKm: number = 5
): { aircraft: AircraftState[]; loading: boolean; error: string | null } {
  const [aircraft, setAircraft] = useState<AircraftState[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    if (!center) return
    setLoading(true)
    try {
      const bounds = buildBounds(center[0], center[1], radiusKm)
      const states = await fetchAirspace(bounds)
      setAircraft(states)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [center, radiusKm])

  useEffect(() => {
    if (!center) return

    poll()
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [center, poll])

  return { aircraft, loading, error }
}
