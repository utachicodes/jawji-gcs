"use client"

import { useEffect, useMemo, useState } from "react"
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

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          altitude: pos.coords.altitude ?? undefined,
        })
      },
      () => {
        // ignore
      },
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 8000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const hasLocation = activeDrone?.location && activeDrone.location.lat !== 0

  const mapCenter: [number, number] = useMemo(() => {
    if (hasLocation) return [activeDrone!.location!.lat, activeDrone!.location!.lng]
    if (userLocation) return [userLocation.lat, userLocation.lng]
    return [37.7749, -122.4194]
  }, [hasLocation, activeDrone, userLocation])

  const homePosition = useMemo(() => {
    if (activeDrone?.homeLocation && activeDrone.homeLocation.lat !== 0) {
      return { lat: activeDrone.homeLocation.lat, lng: activeDrone.homeLocation.lng }
    }
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng }
    return undefined
  }, [activeDrone?.homeLocation, userLocation])

  const currentWaypoints = hasLocation
    ? [{ id: "drone", lat: activeDrone!.location!.lat, lng: activeDrone!.location!.lng, altitude: activeDrone!.location!.altitude ?? 0, action: "current" }]
    : userLocation
      ? [{ id: "local", lat: userLocation.lat, lng: userLocation.lng, altitude: userLocation.altitude ?? 0, action: "current" }]
      : []

  const connectionState: "connected" | "warning" | "disconnected" = useMemo(() => {
    if (!activeDrone) return "disconnected"
    if (activeDrone.status === "offline" || activeDrone.mode === "Disconnected") return "disconnected"
    if (activeDrone.status === "error") return "warning"
    if (activeDrone.signal <= 20 || telemetry.battery <= 20) return "warning"
    return "connected"
  }, [activeDrone, telemetry.battery])

  return (
    <div className="h-full w-full bg-background text-foreground p-3 flex flex-col gap-3 overflow-hidden select-none relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 dark:opacity-10" />

      {/* Main Tactical Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 relative z-10 overflow-hidden">

        {/* Left: System Diagnostics */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <SystemDiagnostics telemetry={telemetry} />
        </div>

        {/* Center: HUD & Video */}
        <div className="col-span-12 lg:col-span-5 h-full overflow-hidden flex flex-col border border-border/40 rounded-xl bg-foreground/[0.03]">
          <TacticalHUD telemetry={telemetry} connectionState={connectionState}>
            <WebRTCPlayer
              streamUrl={activeDrone?.videoUrl || ""}
              droneId={activeDrone?.id || ""}
              connectionState={connectionState}
              fallbackToDeviceCamera={true}
            />
          </TacticalHUD>
        </div>

        {/* Right: Tactical View (Map + Metrics) */}
        <div className="col-span-12 lg:col-span-4 h-full overflow-hidden flex flex-col">
          <TacticalView
            mapMode={mapMode}
            onToggleMapMode={() => setMapMode(mapMode === "2D" ? "3D" : "2D")}
            className="rounded-xl"
            mapElement={
              mapMode === "2D" ? (
                <MapView
                  center={mapCenter}
                  zoom={15}
                  waypoints={currentWaypoints}
                  selectedWaypoint={null}
                  onWaypointClick={() => { }}
                  heading={telemetry.heading}
                  homePosition={homePosition}
                  flightPath={activeDrone?.flightPath?.map((p) => ({ lat: p.lat, lng: p.lng }))}
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
      <div className="h-24 md:h-20 shrink-0 z-10">
        <ControlBar className="rounded-xl" />
      </div>

    </div>
  )
}
