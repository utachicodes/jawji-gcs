import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getDrones, DroneData } from "./firestore-service"

export interface DroneLocation {
  lat: number
  lng: number
  altitude: number
}

// Extends Firestore DroneData with runtime properties
export interface Drone extends DroneData {
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
  gpsCount?: number
}

type CreateDronePayload = Omit<Drone, "id" | "lastSeen" | "orgId"> & { id?: string }

interface DroneStore {
  drones: Drone[]
  selectedDrone: string | null
  isLoading: boolean

  // Actions
  fetchDrones: (orgId: string) => Promise<void>
  addDrone: (drone: Drone, user: any) => Promise<void>
  removeDrone: (id: string) => Promise<void>
  updateDrone: (id: string, updates: Partial<Drone>) => Promise<void>
  selectDrone: (id: string) => void
}

const nowISO = () => new Date().toISOString()

export const useDroneStore = create<DroneStore>()(
  persist(
    (set, get) => ({
      drones: [],
      selectedDrone: null,
      isLoading: false,

      fetchDrones: async (orgId: string) => {
        set({ isLoading: true })
        try {
          const remoteDrones = await getDrones(orgId)

          // Merge remote drones with existing runtime state
          const existing = get().drones
          const merged = remoteDrones.map(rd => {
            const match = existing.find(e => e.id === rd.id)
            if (match) {
              return { ...match, ...rd }
            }
            return {
              ...rd,
              mode: 'Standby',
              battery: 100,
              signal: 100,
              lastSeen: rd.lastSeen
            } as Drone
          })

          set({ drones: merged, isLoading: false })
        } catch (e) {
          console.error("Failed to sync drones", e)
          set({ isLoading: false })
        }
      },

      addDrone: async (drone, user) => {
        // Optimistic update
        const tempId = drone.id || `temp_${Date.now()}`
        set(state => ({ drones: [...state.drones, { ...drone, id: tempId }] }))

        try {
          // Persist
          const { addDrone: fsAddDrone } = await import("./firestore-service")
          const newDrone = await fsAddDrone({
            name: drone.name,
            model: drone.model,
            status: drone.status,
            lastSeen: Date.now()
          }, user)

          // Reconcile ID
          set(state => ({
            drones: state.drones.map(d => d.id === tempId ? { ...d, id: newDrone.id, orgId: newDrone.orgId } : d)
          }))
        } catch (e) {
          console.error(e)
          // Rollback
          set(state => ({ drones: state.drones.filter(d => d.id !== tempId) }))
        }
      },

      removeDrone: async (id) => {
        const { deleteDrone } = await import("./firestore-service")
        set(state => ({ drones: state.drones.filter(d => d.id !== id) }))
        try {
          await deleteDrone(id)
        } catch (e) {
          console.error("Failed to delete drone remote", e)
        }
      },

      updateDrone: async (id, updates) => {
        const { updateDrone: fsUpdateDrone } = await import("./firestore-service")

        // Optimistic
        set((state) => ({
          drones: state.drones.map((d) =>
            d.id === id
              ? {
                ...d,
                ...updates,
                location: mergeLocation(d.location, updates.location),
                lastSeen: Date.now(),
              }
              : d,
          ),
        }))

        try {
          // We only persist core data, not high-frequency telemetry like lat/lng/battery unless needed
          // For now, let's persist status and name/model
          const persistentKeys: (keyof DroneData)[] = ['name', 'model', 'status', 'lastSeen']
          const persistPayload: any = {}
          persistentKeys.forEach(k => {
            if (k in updates) persistPayload[k] = (updates as any)[k]
          })

          if (Object.keys(persistPayload).length > 0) {
            await fsUpdateDrone(id, persistPayload)
          }
        } catch (e) {
          console.error("Failed to update drone remote", e)
        }
      },

      selectDrone: (id) => {
        const exists = get().drones.some((d) => d.id === id)
        if (!exists) return
        set({ selectedDrone: id })
      },
    }),
    {
      name: "jawji-drone-store",
      partialize: (state) => ({ selectedDrone: state.selectedDrone })
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
