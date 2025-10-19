import { useDroneStore } from "@/lib/drone-store"
import type { Drone } from "@/lib/drone-store"

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function startTelemetrySimulator() {
  const interval = setInterval(() => {
    const { drones, selectedDrone, updateDrone } = useDroneStore.getState() as {
      drones: Drone[]
      selectedDrone: string | null
      updateDrone: (id: string, updates: Partial<Drone>) => void
    }
    const id: string | undefined = selectedDrone || drones[0]?.id
    if (!id) return
    const d = drones.find((x: Drone) => x.id === id)
    if (!d) return

    const driftLat = (Math.random() - 0.5) * 0.0002
    const driftLng = (Math.random() - 0.5) * 0.0002

    const nextBattery = clamp((d.battery ?? 100) - Math.random() * 0.05, 0, 100)
    const nextSignal = clamp((d.signal ?? 100) + (Math.random() - 0.5) * 0.5, 0, 100)

    const nextAlt = clamp((d.location?.altitude ?? 40) + (Math.random() - 0.5) * 0.5, 0, 500)

    updateDrone(id, {
      status: nextBattery > 5 ? "flying" : "error",
      battery: nextBattery,
      signal: nextSignal,
      location: d.location
        ? {
            lat: d.location.lat + driftLat,
            lng: d.location.lng + driftLng,
            altitude: nextAlt,
          }
        : undefined,
    })
  }, 1000)

  return () => clearInterval(interval)
}
