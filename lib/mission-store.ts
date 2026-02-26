import { create } from "zustand"
import { persist } from "zustand/middleware"

export type MissionStatus = "draft" | "ready" | "completed" | "active" | "aborted"
export type MissionType = "delivery" | "survey" | "inspection" | "custom"
export type PathType = "discrete" | "continuous"

export type MissionPackage =
  | "obstacle_avoidance"
  | "crop_detection"
  | "drone_detection"
  | "thermal_imaging"
  | "photogrammetry"
  | "payload_release"
  | "rtk_precision"
  | "live_streaming"
  | "ai_tracking"

// Path point for continuous trail following
export interface PathPoint {
  lat: number
  lng: number
  altitude?: number
}

export interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
  // Path support
  pathType?: PathType
  pathPoints?: PathPoint[] // For continuous paths
}

// Delivery mission specific data
export interface DeliveryDetails {
  pickupLocation: { lat: number; lng: number; kioskId?: string }
  dropoffLocation: { lat: number; lng: number; kioskId?: string }
  payload: {
    weight: number // kg
    dimensions?: { length: number; width: number; height: number } // cm
    fragile?: boolean
    description?: string
  }
  dropParameters: {
    altitude: number // meters
    dropMethod: "winch" | "land" | "release"
    confirmationRequired: boolean
  }
}

// Survey mission specific data
export interface SurveyDetails {
  coverageArea: string // GeoJSON polygon
  altitude: number
  overlapPercentage: number
  scanPattern: "grid" | "circular" | "custom"
  captureInterval?: number // seconds
}

// Inspection mission specific data
export interface InspectionDetails {
  inspectionPoints: Array<{
    lat: number
    lng: number
    altitude: number
    hoverDuration: number // seconds
  }>
  cameraSettings: {
    zoom: number
    gimbalPitch: number
    captureMode: "photo" | "video" | "both"
  }
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
  // Mission type and template data
  missionType?: MissionType
  deliveryDetails?: DeliveryDetails
  surveyDetails?: SurveyDetails
  inspectionDetails?: InspectionDetails
  // Planning fields
  droneId?: string
  payload?: string
  altitude?: number
  cruiseSpeed?: number
  geofence?: string
  startTime?: string
  riskAssessment?: string
  checklist?: string[]
  // Mission capability packages
  packages?: MissionPackage[]
  // Full mission path
  waypointData?: Waypoint[]
}

interface MissionStore {
  missions: Mission[]
  activeMissionId: string | null
  addMission: (m: Omit<Mission, "id" | "createdAt" | "lastModified">) => Mission
  updateMission: (id: string, patch: Partial<Mission>) => void
  removeMission: (id: string) => void
  importMissions: (list: Mission[]) => void
  exportMissions: () => string
  clearMissions: () => void
  setActiveMission: (id: string | null) => void
  abortMission: (id: string) => void
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
          missionType: "survey",
          surveyDetails: {
            coverageArea: "",
            altitude: 50,
            overlapPercentage: 70,
            scanPattern: "grid",
            captureInterval: 2
          }
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
          missionType: "inspection",
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
          missionType: "delivery",
          deliveryDetails: {
            pickupLocation: { lat: 37.7800, lng: -122.4200 },
            dropoffLocation: { lat: 37.7850, lng: -122.4250 },
            payload: {
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              fragile: false,
              description: "Medical supplies"
            },
            dropParameters: {
              altitude: 5,
              dropMethod: "land",
              confirmationRequired: true
            }
          },
          waypointData: [
            { id: "wp-1", lat: 37.7749, lng: -122.4194, altitude: 30, action: "takeoff", pathType: "discrete" },
            { id: "wp-2", lat: 37.7800, lng: -122.4200, altitude: 50, action: "pickup", pathType: "discrete" },
            { id: "wp-3", lat: 37.7850, lng: -122.4250, altitude: 50, action: "dropoff", pathType: "discrete" },
            { id: "wp-4", lat: 37.7749, lng: -122.4194, altitude: 30, action: "land", pathType: "discrete" }
          ]
        },
      ],
      activeMissionId: null,
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
      setActiveMission: (id) => set({ activeMissionId: id }),
      abortMission: (id) => {
        set((s) => ({
          missions: s.missions.map((x) => (x.id === id ? { ...x, status: "aborted" as MissionStatus, lastModified: new Date().toISOString().split("T")[0] } : x)),
          activeMissionId: s.activeMissionId === id ? null : s.activeMissionId
        }))
      },
    }),
    { name: "jawji-missions" }
  )
)
