import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Kiosk {
    id: string
    name: string
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
                {
                    id: "kiosk-1",
                    name: "Downtown Hub",
                    location: { lat: 37.7800, lng: -122.4200, altitude: 0 },
                    status: "active",
                    capacity: {
                        maxWeight: 50,
                        maxVolume: 100,
                        currentLoad: 20,
                    },
                    features: {
                        cooling: true,
                        secure: true,
                    },
                    metadata: {
                        address: "123 Market St, San Francisco, CA",
                        operatingHours: "24/7",
                    },
                },
                {
                    id: "kiosk-2",
                    name: "East Bay Station",
                    location: { lat: 37.7850, lng: -122.4250, altitude: 0 },
                    status: "active",
                    capacity: {
                        maxWeight: 30,
                        maxVolume: 60,
                        currentLoad: 10,
                    },
                    features: {
                        secure: true,
                    },
                    metadata: {
                        address: "456 Broadway, Oakland, CA",
                        operatingHours: "6am-10pm",
                    },
                },
                {
                    id: "kiosk-3",
                    name: "Medical Center Drop",
                    location: { lat: 37.7750, lng: -122.4150, altitude: 0 },
                    status: "active",
                    capacity: {
                        maxWeight: 20,
                        maxVolume: 40,
                        currentLoad: 5,
                    },
                    features: {
                        cooling: true,
                        heated: true,
                        secure: true,
                    },
                    metadata: {
                        address: "789 Hospital Way, San Francisco, CA",
                        operatingHours: "24/7",
                    },
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
