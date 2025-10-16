import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Drone {
  id: string
  name: string
  model: string
  status: "online" | "offline" | "flying" | "error"
  mode: string
  battery: number
  signal: number
  location?: {
    lat: number
    lng: number
    altitude: number
  }
  lastSeen: string
}

interface DroneStore {
  drones: Drone[]
  selectedDrone: string | null
  addDrone: (drone: Omit<Drone, "id" | "lastSeen">) => void
  removeDrone: (id: string) => void
  updateDrone: (id: string, updates: Partial<Drone>) => void
  selectDrone: (id: string) => void
}

export const useDroneStore = create<DroneStore>()(
  persist(
    (set) => ({
      drones: [
        {
          id: "drone-1",
          name: "JAWJI-001",
          model: "Autonomous X1",
          status: "online",
          mode: "GPS-Denied",
          battery: 87,
          signal: 92,
          location: {
            lat: 37.7749,
            lng: -122.4194,
            altitude: 45.2,
          },
          lastSeen: new Date().toISOString(),
        },
        {
          id: "drone-2",
          name: "JAWJI-002",
          model: "Autonomous X1",
          status: "offline",
          mode: "Standby",
          battery: 100,
          signal: 0,
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      selectedDrone: "drone-1",
      addDrone: (drone) =>
        set((state) => ({
          drones: [
            ...state.drones,
            {
              ...drone,
              id: `drone-${Date.now()}`,
              lastSeen: new Date().toISOString(),
            },
          ],
        })),
      removeDrone: (id) =>
        set((state) => ({
          drones: state.drones.filter((d) => d.id !== id),
          selectedDrone: state.selectedDrone === id ? state.drones[0]?.id || null : state.selectedDrone,
        })),
      updateDrone: (id, updates) =>
        set((state) => ({
          drones: state.drones.map((d) => (d.id === id ? { ...d, ...updates, lastSeen: new Date().toISOString() } : d)),
        })),
      selectDrone: (id) => set({ selectedDrone: id }),
    }),
    {
      name: "jawji-drone-store",
    },
  ),
)
