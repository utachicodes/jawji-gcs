"use client"

import { useState } from "react"
import { useDroneStore } from "@/lib/drone-store"
import { useTelemetry, deriveTelemetry } from "@/lib/telemetry"
import dynamic from "next/dynamic"

// New Tactical Components
import { SystemDiagnostics } from "./dashboard/system-diagnostics"
import { TacticalHUD } from "./dashboard/tactical-hud"
import { TacticalView } from "./dashboard/tactical-view"
import { ControlBar } from "./dashboard/control-bar"
import { WebRTCPlayer } from "@/components/webrtc-player"

// Dynamically import map components
const MapView = dynamic(
  () => import("@/components/map-view").then((m) => m.MapView),
  { ssr: false }
)
const MapView3D = dynamic(
  () => import("@/components/map-view-3d").then((m) => m.MapView3D),
  { ssr: false }
)

export function UnifiedDashboard() {
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find(d => d.id === selectedDrone)
  const realTelemetry = useTelemetry()
  const telemetry = activeDrone ? deriveTelemetry(activeDrone) : realTelemetry

  const [mapMode, setMapMode] = useState<"2D" | "3D">("2D")

  const hasLocation = activeDrone?.location && activeDrone.location.lat !== 0
  const mapCenter: [number, number] = hasLocation
    ? [activeDrone!.location!.lat, activeDrone!.location!.lng]
    : [37.7749, -122.4194]

  const currentWaypoints = hasLocation
    ? [{ id: "drone", lat: activeDrone!.location!.lat, lng: activeDrone!.location!.lng, altitude: activeDrone!.location!.altitude ?? 0, action: "current" }]
    : []

  return (
    <div className="h-screen w-full bg-background text-foreground p-3 flex flex-col gap-3 overflow-hidden select-none relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 dark:opacity-10" />

      {/* Main Tactical Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 relative z-10 overflow-hidden">

        {/* Left: System Diagnostics */}
        <div className="col-span-12 lg:col-span-2 h-full overflow-hidden">
          <SystemDiagnostics telemetry={telemetry} />
        </div>

        {/* Center: HUD & Video */}
        <div className="col-span-12 lg:col-span-7 h-full overflow-hidden flex flex-col border border-border/40 rounded-xl bg-black/20">
          <TacticalHUD telemetry={telemetry}>
            <WebRTCPlayer
              streamUrl={activeDrone?.videoUrl || ""}
              droneId={activeDrone?.id || ""}
            />
          </TacticalHUD>
        </div>

        {/* Right: Tactical View (Map + Metrics) */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden flex flex-col">
          <TacticalView
            telemetry={telemetry}
            mapMode={mapMode}
            onToggleMapMode={() => setMapMode(mapMode === "2D" ? "3D" : "2D")}
            className="rounded-xl"
            mapElement={
              mapMode === "2D" ? (
                <MapView
                  center={mapCenter}
                  zoom={15}
                  waypoints={currentWaypoints}
                  // @ts-ignore
                  isInteractive={false}
                />
              ) : (
                <MapView3D
                  center={mapCenter}
                  altitude={activeDrone?.location?.altitude || 100}
                  heading={activeDrone?.heading || 0}
                  waypoints={currentWaypoints}
                />
              )
            }
          />
        </div>

      </div>

      {/* Bottom: Control Interface */}
      <div className="h-28 shrink-0 z-10">
        <ControlBar className="rounded-xl" />
      </div>

    </div>
  )
}
