"use client"

import { useEffect } from "react"
import { useDroneStore } from "@/lib/drone-store"

export function TelemetryBootstrap() {
  useEffect(() => {
    const { addDrone, updateDrone, drones } = useDroneStore.getState() as unknown as {
      addDrone: (drone: {
        name: string
        model: string
        status: "online" | "offline" | "flying" | "error"
        mode: string
        battery: number
        signal: number
        location?: { lat: number; lng: number; altitude: number }
      }) => void
      updateDrone: (id: string, updates: any) => void
      drones: Array<{ id: string }>
    }

    function applyUpdate(payload: any) {
      const id: string = payload.droneId || "drone-1"
      const exists = (useDroneStore.getState() as any).drones.some((d: any) => d.id === id)
      if (!exists) {
        addDrone({
          name: id,
          model: payload.model || "Unknown",
          status: payload.status || "online",
          mode: payload.mode || "AUTO",
          battery: typeof payload.battery === "number" ? payload.battery : 100,
          signal: typeof payload.signal === "number" ? payload.signal : 100,
          location: payload.location
            ? {
                lat: payload.location.lat,
                lng: payload.location.lng,
                altitude: payload.location.altitude ?? payload.altitude ?? 0,
              }
            : undefined,
        })
      } else {
        const updates: any = {}
        if (typeof payload.status === "string") updates.status = payload.status
        if (typeof payload.mode === "string") updates.mode = payload.mode
        if (typeof payload.battery === "number") updates.battery = payload.battery
        if (typeof payload.signal === "number") updates.signal = payload.signal
        if (payload.location && typeof payload.location.lat === "number" && typeof payload.location.lng === "number") {
          updates.location = {
            lat: payload.location.lat,
            lng: payload.location.lng,
            altitude: payload.location.altitude ?? payload.altitude ?? (useDroneStore.getState() as any).drones.find((d: any) => d.id === id)?.location?.altitude ?? 0,
          }
        } else if (typeof payload.altitude === "number") {
          const current = (useDroneStore.getState() as any).drones.find((d: any) => d.id === id)?.location
          if (current) {
            updates.location = { ...current, altitude: payload.altitude }
          }
        }
        updateDrone(id, updates)
      }
    }

    const es = new EventSource("/api/telemetry/stream")
    es.addEventListener("telemetry", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        applyUpdate(data)
      } catch {
        // ignore malformed messages
      }
    })
    // Optional: log connection open and keepalive
    // es.addEventListener("open", () => {})
    // es.addEventListener("ping", () => {})

    return () => {
      es.close()
    }
  }, [])
  return null
}
