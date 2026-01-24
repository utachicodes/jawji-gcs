"use client"

import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { PreFlightChecklist } from "@/components/pre-flight-checklist"
import { useSearchParams } from "next/navigation"
import React from "react"
import { useMissionStore } from "@/lib/mission-store"
import { Card } from "@/components/ui/card"
import { MapView } from "@/components/map-view"

export default function PreFlightPage() {
  const params = useSearchParams()
  const missionId = params.get("missionId") || undefined
  const missions = useMissionStore((s) => s.missions)
  const mission = missions.find((m) => m.id === missionId)
  const waypoints = mission?.waypointData || []
  const center = waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : [37.7749, -122.4194]
  const totalDistanceKm = (() => {
    if (!waypoints || waypoints.length < 2) return 0
    let total = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i]
      const b = waypoints[i + 1]
      const R = 6371
      const dLat = ((b.lat - a.lat) * Math.PI) / 180
      const dLon = ((b.lng - a.lng) * Math.PI) / 180
      const lat1 = (a.lat * Math.PI) / 180
      const lat2 = (b.lat * Math.PI) / 180
      const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
      total += R * c
    }
    return total
  })()
  const estMinutes = totalDistanceKm > 0 ? Math.round((totalDistanceKm / 0.005) * 60) : 0
  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full p-4 lg:p-6 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 space-y-4 overflow-auto pr-1">
              <div>
                <h1 className="text-3xl font-bold font-mono">PRE-FLIGHT CHECKLIST</h1>
                <p className="text-muted-foreground mt-2 font-mono">
                  Complete all critical checks before flight operations
                </p>
              </div>
              {mission && (
                <Card className="p-4">
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground font-mono">MISSION</div>
                    <div className="text-lg font-semibold">{mission.name}</div>
                  </div>
                  <div className="h-64 w-full overflow-hidden rounded-md border-border/40">
                    <MapView
                      waypoints={waypoints.map((w) => ({ ...w }))}
                      selectedWaypoint={waypoints[0]?.id || null}
                      onWaypointClick={() => {}}
                      center={center as [number, number]}
                      zoom={14}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm font-mono">
                    <div>
                      <div className="text-muted-foreground">Waypoints</div>
                      <div className="text-foreground font-semibold">{waypoints.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Distance</div>
                      <div className="text-foreground font-semibold">{totalDistanceKm.toFixed(2)} km</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Est. Time</div>
                      <div className="text-foreground font-semibold">{estMinutes} min</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
            <div className="lg:col-span-3 h-full overflow-auto pl-1">
              <PreFlightChecklist missionId={missionId} />
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
