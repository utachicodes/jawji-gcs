"use client"

import { useState, useEffect } from "react"
import { MapPin, Package, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useKioskStore, type Kiosk } from "@/lib/kiosk-store"

interface KioskSelectorProps {
    selectedKioskId?: string
    onSelect: (kiosk: Kiosk) => void
    mode?: "pickup" | "dropoff"
    centerLocation?: { lat: number; lng: number }
    maxDistance?: number // in km
}

export function KioskSelector({
    selectedKioskId,
    onSelect,
    mode = "dropoff",
    centerLocation,
    maxDistance = 50,
}: KioskSelectorProps) {
    const kiosks = useKioskStore((s) => s.kiosks)
    const getNearbyKiosks = useKioskStore((s) => s.getNearbyKiosks)
    const [filteredKiosks, setFilteredKiosks] = useState<Kiosk[]>(kiosks)

    useEffect(() => {
        if (centerLocation) {
            const nearby = getNearbyKiosks(centerLocation.lat, centerLocation.lng, maxDistance)
            setFilteredKiosks(nearby.filter((k) => k.status === "active"))
        } else {
            setFilteredKiosks(kiosks.filter((k) => k.status === "active"))
        }
    }, [centerLocation, maxDistance, kiosks, getNearbyKiosks])

    const getStatusColor = (status: Kiosk["status"]) => {
        switch (status) {
            case "active":
                return "bg-green-500"
            case "inactive":
                return "bg-gray-500"
            case "maintenance":
                return "bg-yellow-500"
            default:
                return "bg-gray-500"
        }
    }

    const getCapacityPercentage = (kiosk: Kiosk) => {
        return (kiosk.capacity.currentLoad / kiosk.capacity.maxWeight) * 100
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                    {mode === "pickup" ? "Pickup Location" : "Drop-off Location"}
                </h3>
                <Badge variant="outline" className="text-xs">
                    {filteredKiosks.length} available
                </Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredKiosks.length === 0 ? (
                    <Card className="p-4 text-center text-sm text-muted-foreground">
                        No active kiosks found in range
                    </Card>
                ) : (
                    filteredKiosks.map((kiosk) => {
                        const isSelected = selectedKioskId === kiosk.id
                        const capacityPct = getCapacityPercentage(kiosk)

                        return (
                            <Card
                                key={kiosk.id}
                                className={`p-3 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                                    }`}
                                onClick={() => onSelect(kiosk)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`h-2 w-2 rounded-full mt-2 ${getStatusColor(kiosk.status)}`} />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-sm">{kiosk.name}</h4>
                                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                            </div>

                                            {kiosk.metadata?.address && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {kiosk.metadata.address}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 flex-wrap">
                                                {kiosk.features.cooling && (
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        ❄️ Cooling
                                                    </Badge>
                                                )}
                                                {kiosk.features.heated && (
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        🔥 Heated
                                                    </Badge>
                                                )}
                                                {kiosk.features.secure && (
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        🔒 Secure
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1 pt-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Capacity</span>
                                                    <span className="font-mono">
                                                        {kiosk.capacity.currentLoad}kg / {kiosk.capacity.maxWeight}kg
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${capacityPct > 80 ? "bg-red-500" : capacityPct > 50 ? "bg-yellow-500" : "bg-green-500"
                                                            }`}
                                                        style={{ width: `${capacityPct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {kiosk.metadata?.operatingHours && (
                                                <p className="text-xs text-muted-foreground">
                                                    Hours: {kiosk.metadata.operatingHours}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>

            {selectedKioskId && (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                        const selectedKiosk = filteredKiosks.find((k) => k.id === selectedKioskId)
                        if (selectedKiosk) {
                            // This could trigger map centering in parent component
                            console.log("Show on map:", selectedKiosk)
                        }
                    }}
                >
                    <MapPin className="h-3 w-3 mr-2" />
                    Show on Map
                </Button>
            )}
        </div>
    )
}
