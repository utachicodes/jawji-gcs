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
  fetchMissions: (orgId: string) => Promise<void>
  addMission: (m: Omit<Mission, "id" | "createdAt" | "lastModified">, user: any) => Promise<void>
  updateMission: (id: string, patch: Partial<Mission>) => Promise<void>
  removeMission: (id: string) => Promise<void>
  importMissions: (list: Mission[]) => void
  exportMissions: () => string
  clearMissions: () => void
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => ({
      missions: [],

      fetchMissions: async (orgId) => {
        const { getMissions } = await import("./firestore-service")
        try {
          const remote = await getMissions(orgId)
          // Transform generic 'data' blob back to typed mission
          const typedMissions = remote.map(r => ({
            ...r.data,
            id: r.id,
            orgId: r.orgId,
            // Ensure defaults
            status: r.status || r.data.status || 'draft'
          }))
          set({ missions: typedMissions })
        } catch (e) {
          console.error(e)
        }
      },

      addMission: async (m, user) => {
        const now = new Date().toISOString().split("T")[0]
        const tempId = `temp_${Date.now()}`
        const mission: Mission = { id: tempId, createdAt: now, lastModified: now, ...m }

        // Optimistic
        set((s) => ({ missions: [...s.missions, mission] }))

        try {
          const { saveMission } = await import("./firestore-service")
          // Separate metadata from payload data
          const { id, orgId, ...rest } = mission as any
          const saved = await saveMission({
            name: m.name,
            description: m.description,
            status: m.status,
            data: rest // Store structure in 'data' blob
          }, user)

          // Reconcile
          set(s => ({
            missions: s.missions.map(x => x.id === tempId ? { ...x, id: saved.id } : x)
          }))
        } catch (e) {
          console.error(e)
          set(s => ({ missions: s.missions.filter(x => x.id !== tempId) }))
        }
      },

      updateMission: async (id, patch) => {
        const { updateMission: fsUpdateMission } = await import("./firestore-service")
        const now = new Date().toISOString().split("T")[0]
        const mission = get().missions.find(m => m.id === id)
        if (!mission) return

        set((s) => ({
          missions: s.missions.map((x) => (x.id === id ? { ...x, ...patch, lastModified: now } : x)),
        }))

        try {
          // Determine if we need to update top-level fields or data blob
          const topLevel = ['name', 'description', 'status']
          const updates: any = {}
          if (patch.name) updates.name = patch.name
          if (patch.description) updates.description = patch.description
          if (patch.status) updates.status = patch.status

          // If data fields changed, update 'data'
          const newData = { ...mission, ...patch }
          const { id: _, orgId: __, ...dataPayload } = newData as any
          updates.data = dataPayload

          await fsUpdateMission(id, updates)
        } catch (e) { console.error(e) }
      },

      removeMission: async (id) => {
        const { deleteMission } = await import("./firestore-service")
        set((s) => ({ missions: s.missions.filter((m) => m.id !== id) }))
        try { await deleteMission(id) } catch (e) { console.error(e) }
      },

      importMissions: (list) => set(() => ({ missions: list })),
      exportMissions: () => JSON.stringify(get().missions, null, 2),
      clearMissions: () => set({ missions: [] }),
    }),
    { name: "jawji-missions" }
  )
)
