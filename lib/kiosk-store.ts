import { create } from "zustand"
import { persist } from "zustand/middleware"

export type KioskCategory = "medical" | "warehouse" | "campus" | "urban" | "field"

export interface Kiosk {
    id: string
    name: string
    category: KioskCategory
    location: {
        lat: number
        lng: number
        altitude?: number
    }
    status: "active" | "inactive" | "maintenance"
    capacity: {
        maxWeight: number // kg
        maxVolume: number // liters
        currentLoad: number // kg
    }
    features: {
        cooling?: boolean
        heated?: boolean
        secure?: boolean
    }
    metadata?: {
        address?: string
        contact?: string
        operatingHours?: string
    }
}

interface KioskStore {
    kiosks: Kiosk[]
    addKiosk: (kiosk: Omit<Kiosk, "id">) => Kiosk
    updateKiosk: (id: string, patch: Partial<Kiosk>) => void
    removeKiosk: (id: string) => void
    getKiosk: (id: string) => Kiosk | undefined
    getNearbyKiosks: (lat: number, lng: number, radiusKm: number) => Kiosk[]
}

export const useKioskStore = create<KioskStore>()(
    persist(
        (set, get) => ({
            kiosks: [
                // Medical / Hospital kiosks
                {
                    id: "kiosk-med-1",
                    name: "General Hospital Hub",
                    category: "medical",
                    location: { lat: 37.7750, lng: -122.4150, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 20, maxVolume: 40, currentLoad: 5 },
                    features: { cooling: true, heated: true, secure: true },
                    metadata: { address: "789 Hospital Way, San Francisco, CA", operatingHours: "24/7" },
                },
                {
                    id: "kiosk-med-2",
                    name: "UCSF Medical Center",
                    category: "medical",
                    location: { lat: 37.7631, lng: -122.4586, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 25, maxVolume: 50, currentLoad: 8 },
                    features: { cooling: true, heated: true, secure: true },
                    metadata: { address: "505 Parnassus Ave, San Francisco, CA", operatingHours: "24/7" },
                },
                {
                    id: "kiosk-med-3",
                    name: "Pharmacy Express Drop",
                    category: "medical",
                    location: { lat: 37.7843, lng: -122.4090, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 10, maxVolume: 20, currentLoad: 2 },
                    features: { cooling: true, secure: true },
                    metadata: { address: "22 Pharmacy Blvd, San Francisco, CA", operatingHours: "8am-10pm" },
                },
                // Warehouse / Logistics kiosks
                {
                    id: "kiosk-wh-1",
                    name: "Downtown Hub",
                    category: "warehouse",
                    location: { lat: 37.7800, lng: -122.4200, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 50, maxVolume: 100, currentLoad: 20 },
                    features: { cooling: true, secure: true },
                    metadata: { address: "123 Market St, San Francisco, CA", operatingHours: "24/7" },
                },
                {
                    id: "kiosk-wh-2",
                    name: "East Bay Logistics",
                    category: "warehouse",
                    location: { lat: 37.7850, lng: -122.4250, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 80, maxVolume: 150, currentLoad: 35 },
                    features: { secure: true },
                    metadata: { address: "456 Broadway, Oakland, CA", operatingHours: "6am-10pm" },
                },
                {
                    id: "kiosk-wh-3",
                    name: "South Bay Depot",
                    category: "warehouse",
                    location: { lat: 37.7690, lng: -122.4300, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 100, maxVolume: 200, currentLoad: 60 },
                    features: { secure: true },
                    metadata: { address: "900 Industrial Pkwy, South SF, CA", operatingHours: "5am-11pm" },
                },
                // University Campus kiosks
                {
                    id: "kiosk-campus-1",
                    name: "UC Berkeley Engineering",
                    category: "campus",
                    location: { lat: 37.8724, lng: -122.2595, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 15, maxVolume: 30, currentLoad: 3 },
                    features: { secure: true },
                    metadata: { address: "Cory Hall, UC Berkeley, CA", operatingHours: "7am-10pm" },
                },
                {
                    id: "kiosk-campus-2",
                    name: "Stanford Main Quad",
                    category: "campus",
                    location: { lat: 37.4275, lng: -122.1697, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 15, maxVolume: 30, currentLoad: 7 },
                    features: { secure: true },
                    metadata: { address: "Main Quad, Stanford University, CA", operatingHours: "8am-8pm" },
                },
                // Urban Hub kiosks
                {
                    id: "kiosk-urban-1",
                    name: "Civic Center Plaza",
                    category: "urban",
                    location: { lat: 37.7793, lng: -122.4193, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 30, maxVolume: 60, currentLoad: 10 },
                    features: { secure: true },
                    metadata: { address: "1 Dr Carlton B Goodlett Pl, San Francisco, CA", operatingHours: "6am-10pm" },
                },
                {
                    id: "kiosk-urban-2",
                    name: "Ferry Building Market",
                    category: "urban",
                    location: { lat: 37.7956, lng: -122.3935, altitude: 0 },
                    status: "active",
                    capacity: { maxWeight: 20, maxVolume: 40, currentLoad: 12 },
                    features: { cooling: true, secure: true },
                    metadata: { address: "1 Ferry Building, San Francisco, CA", operatingHours: "7am-6pm" },
                },
                // Rural / Field kiosks
                {
                    id: "kiosk-field-1",
                    name: "Marin Ag Station",
                    category: "field",
                    location: { lat: 37.9835, lng: -122.5311, altitude: 10 },
                    status: "active",
                    capacity: { maxWeight: 40, maxVolume: 80, currentLoad: 5 },
                    features: { heated: true },
                    metadata: { address: "Rural Route 1, Marin County, CA", operatingHours: "Sunrise-Sunset" },
                },
                {
                    id: "kiosk-field-2",
                    name: "Napa Valley Drop",
                    category: "field",
                    location: { lat: 38.2975, lng: -122.2869, altitude: 20 },
                    status: "active",
                    capacity: { maxWeight: 50, maxVolume: 100, currentLoad: 0 },
                    features: { cooling: true },
                    metadata: { address: "Vineyard Rd, Napa Valley, CA", operatingHours: "6am-8pm" },
                },
            ],
            addKiosk: (kiosk) => {
                const newKiosk: Kiosk = {
                    id: `kiosk-${Date.now()}`,
                    ...kiosk,
                }
                set((s) => ({ kiosks: [...s.kiosks, newKiosk] }))
                return newKiosk
            },
            updateKiosk: (id, patch) => {
                set((s) => ({
                    kiosks: s.kiosks.map((k) => (k.id === id ? { ...k, ...patch } : k)),
                }))
            },
            removeKiosk: (id) => {
                set((s) => ({ kiosks: s.kiosks.filter((k) => k.id !== id) }))
            },
            getKiosk: (id) => {
                return get().kiosks.find((k) => k.id === id)
            },
            getNearbyKiosks: (lat, lng, radiusKm) => {
                const kiosks = get().kiosks
                return kiosks.filter((k) => {
                    const distance = calculateDistance(lat, lng, k.location.lat, k.location.lng)
                    return distance <= radiusKm
                })
            },
        }),
        { name: "jawji-kiosks" }
    )
)

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}
