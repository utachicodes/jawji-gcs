import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface DroneLocation {
  lat: number
  lng: number
  altitude: number
}

export interface Drone {
  id: string
  name: string
  model: string
  status: "online" | "offline" | "flying" | "error"
  mode: string
  battery: number
  signal: number
  location?: DroneLocation
  speed?: number
  heading?: number
  pitch?: number
  roll?: number
  yaw?: number
  temperature?: number
  flightTime?: number
  videoUrl?: string
  extras?: Record<string, unknown>
  lastSeen: string
}

type CreateDronePayload = Omit<Drone, "id" | "lastSeen"> & { id?: string }

interface DroneStore {
  drones: Drone[]
  selectedDrone: string | null
  addDrone: (drone: CreateDronePayload) => void
  removeDrone: (id: string) => void
  updateDrone: (id: string, updates: Partial<Drone>) => void
  selectDrone: (id: string) => void
}

const nowISO = () => new Date().toISOString()

export const useDroneStore = create<DroneStore>()(
  persist(
    (set, get) => ({
      drones: [],
      selectedDrone: null,
      addDrone: (drone) =>
        set((state) => {
          const id = drone.id ?? `drone-${Date.now()}`
          const next: Drone = {
            ...drone,
            id,
            lastSeen: nowISO(),
          }
          const exists = state.drones.some((d) => d.id === id)

          const drones = exists
            ? state.drones.map((d) => (d.id === id ? { ...d, ...next, location: mergeLocation(d.location, next.location) } : d))
            : [...state.drones, next]

          return {
            drones,
            selectedDrone: state.selectedDrone ?? id,
          }
        }),
      removeDrone: (id) =>
        set((state) => {
          const filtered = state.drones.filter((d) => d.id !== id)
          return {
            drones: filtered,
            selectedDrone: state.selectedDrone === id ? filtered[0]?.id ?? null : state.selectedDrone,
          }
        }),
      updateDrone: (id, updates) =>
        set((state) => {
          const exists = state.drones.some((d) => d.id === id)
          if (!exists) {
            return {
              drones: [
                ...state.drones,
                {
                  id,
                  name: id,
                  model: "Unknown",
                  status: "offline",
                  mode: "Standby",
                  battery: 0,
                  signal: 0,
                  lastSeen: nowISO(),
                  ...updates,
                },
              ],
              selectedDrone: state.selectedDrone ?? id,
            }
          }

          return {
            drones: state.drones.map((d) =>
              d.id === id
                ? {
                    ...d,
                    ...updates,
                    location: mergeLocation(d.location, updates.location),
                    lastSeen: nowISO(),
                  }
                : d,
            ),
          }
        }),
      selectDrone: (id) => {
        const exists = get().drones.some((d) => d.id === id)
        if (!exists) return
        set({ selectedDrone: id })
      },
    }),
    {
      name: "jawji-drone-store",
    },
  ),
)

function mergeLocation(current?: DroneLocation, next?: DroneLocation) {
  if (!next) return current
  if (!current) {
    if (!isFiniteNumber(next.lat) || !isFiniteNumber(next.lng)) {
      return undefined
    }
    return {
      lat: next.lat,
      lng: next.lng,
      altitude: isFiniteNumber(next.altitude) ? next.altitude : 0,
    }
  }
  return {
    lat: isFiniteNumber(next.lat) ? next.lat : current.lat,
    lng: isFiniteNumber(next.lng) ? next.lng : current.lng,
    altitude: isFiniteNumber(next.altitude) ? next.altitude : current.altitude,
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}
