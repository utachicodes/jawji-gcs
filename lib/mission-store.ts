import { create } from "zustand"
import { persist } from "zustand/middleware"

export type MissionStatus = "draft" | "ready" | "completed"

export interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
}

export interface Mission {
  id: string
  name: string
  description: string
  waypoints: number
  distance: number
  duration: number
  createdAt: string
  lastModified: string
  status: MissionStatus
  // Planning fields
  droneId?: string
  payload?: string
  altitude?: number
  cruiseSpeed?: number
  geofence?: string
  startTime?: string
  riskAssessment?: string
  checklist?: string[]
  // Full mission path
  waypointData?: Waypoint[]
}

interface MissionStore {
  missions: Mission[]
  addMission: (m: Omit<Mission, "id" | "createdAt" | "lastModified">) => Mission
  updateMission: (id: string, patch: Partial<Mission>) => void
  removeMission: (id: string) => void
  importMissions: (list: Mission[]) => void
  exportMissions: () => string
  clearMissions: () => void
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => ({
      missions: [
        {
          id: "seed-1",
          name: "Survey Mission 01",
          description: "Aerial survey of construction site area",
          waypoints: 12,
          distance: 2.4,
          duration: 8.5,
          createdAt: "2025-01-10",
          lastModified: "2025-01-12",
          status: "ready",
        },
        {
          id: "seed-2",
          name: "Perimeter Inspection",
          description: "Security perimeter check with thermal imaging",
          waypoints: 8,
          distance: 1.8,
          duration: 6.2,
          createdAt: "2025-01-08",
          lastModified: "2025-01-11",
          status: "completed",
        },
        {
          id: "seed-3",
          name: "Delivery with Kiosks",
          description: "Autonomous delivery routine: Warehouse Pickup -> Kiosk A -> Kiosk B -> Return",
          waypoints: 4,
          distance: 5.2,
          duration: 12.0,
          createdAt: "2025-01-20",
          lastModified: "2025-01-22",
          status: "ready",
          waypointData: [
            { id: "wp-1", lat: 37.7749, lng: -122.4194, altitude: 30, action: "takeoff" },
            { id: "wp-2", lat: 37.7800, lng: -122.4200, altitude: 50, action: "pickup" },
            { id: "wp-3", lat: 37.7850, lng: -122.4250, altitude: 50, action: "dropoff" },
            { id: "wp-4", lat: 37.7749, lng: -122.4194, altitude: 30, action: "land" }
          ]
        },
      ],
      addMission: (m) => {
        const now = new Date().toISOString().split("T")[0]
        const mission: Mission = { id: Date.now().toString(), createdAt: now, lastModified: now, ...m }
        set((s) => ({ missions: [...s.missions, mission] }))
        return mission
      },
      updateMission: (id, patch) => {
        set((s) => ({
          missions: s.missions.map((x) => (x.id === id ? { ...x, ...patch, lastModified: new Date().toISOString().split("T")[0] } : x)),
        }))
      },
      removeMission: (id) => set((s) => ({ missions: s.missions.filter((m) => m.id !== id) })),
      importMissions: (list) => set(() => ({ missions: list })),
      exportMissions: () => JSON.stringify(get().missions, null, 2),
      clearMissions: () => set({ missions: [] }),
    }),
    { name: "jawji-missions" }
  )
)
