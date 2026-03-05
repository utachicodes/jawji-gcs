"use client"

import { useState } from "react"
import { useDroneStore } from "@/lib/drone-store"
import { useTelemetry, deriveTelemetry } from "@/lib/telemetry"
import dynamic from "next/dynamic"
import { CenterCrosshair } from "@/components/dashboard/center-crosshair"
import { SystemHealthCard, PowerSystemCard } from "@/components/dashboard/floating-system-cards"
import { BottomTelemetryBar } from "@/components/dashboard/bottom-telemetry-bar"
import { RightActionPanel } from "@/components/dashboard/right-action-panel"
import { WebRTCPlayer } from "@/components/webrtc-player"
import { Layers, Map } from "lucide-react"

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
  const [viewMode, setViewMode] = useState<"map" | "video">("map")

  const hasLocation = activeDrone?.location && activeDrone.location.lat !== 0
  const mapCenter: [number, number] = hasLocation
    ? [activeDrone!.location!.lat, activeDrone!.location!.lng]
    : [37.7749, -122.4194]

  const currentWaypoints = hasLocation
    ? [{ id: "drone", lat: activeDrone!.location!.lat, lng: activeDrone!.location!.lng, altitude: activeDrone!.location!.altitude ?? 0, action: "current" }]
    : []

  return (
    <div className="flex-1 w-full overflow-hidden relative select-none bg-zinc-950">

      {/* ── BACKGROUND LAYER: Full-screen Map or Video ────────────────── */}
      <div className="absolute inset-0 z-0">
        {viewMode === "video" && activeDrone?.videoUrl ? (
          <WebRTCPlayer
            streamUrl={activeDrone.videoUrl}
            droneId={activeDrone.id}
          />
        ) : mapMode === "2D" ? (
          <MapView
            center={mapCenter}
            zoom={15}
            waypoints={currentWaypoints}
            // @ts-ignore
            isInteractive={true}
          />
        ) : (
          <MapView3D
            center={mapCenter}
            altitude={activeDrone?.location?.altitude || 100}
            heading={activeDrone?.heading || 0}
            waypoints={currentWaypoints}
          />
        )}
      </div>

      {/* ── OVERLAY LAYER: All floating UI panels ──────────────────────── */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col">

        {/* TOP ROW */}
        <div className="flex items-start justify-between gap-3">

          {/* Top-Left: System Health + Power System stacked */}
          <div className="flex flex-col gap-3">
            <SystemHealthCard telemetry={telemetry} />
            <PowerSystemCard telemetry={telemetry} />
          </div>

          {/* Top-Center: spacer */}
          <div className="flex-1" />

          {/* Top-Right: Map / View toggles + Right Action Panel */}
          <div className="flex flex-col items-end gap-3">
            {/* View mode toggles */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => setViewMode(v => v === "map" ? "video" : "map")}
                title="Toggle Video/Map"
                className="bg-black/50 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all"
              >
                <Map className="h-3 w-3" />
                {viewMode === "map" ? "Video" : "Map"}
              </button>
              {viewMode === "map" && (
                <button
                  onClick={() => setMapMode(m => m === "2D" ? "3D" : "2D")}
                  className="bg-black/50 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all"
                >
                  <Layers className="h-3 w-3" />
                  {mapMode === "2D" ? "3D" : "2D"}
                </button>
              )}
            </div>

            {/* Right Action Panel: Camera stats + action buttons */}
            <RightActionPanel />
          </div>
        </div>

        {/* CENTER SPACER: lets the crosshair live in the middle */}
        <div className="flex-1 relative">
          <CenterCrosshair pitch={telemetry.pitch} />
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-end justify-between gap-3">

          {/* Bottom-Left: Mini Map */}
          {viewMode === "video" && (
            <div className="pointer-events-auto rounded-xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-48 h-36">
              <MapView
                center={mapCenter}
                zoom={14}
                waypoints={currentWaypoints}
                // @ts-ignore
                isInteractive={false}
              />
            </div>
          )}
          {viewMode !== "video" && <div />}

          {/* Bottom-Center: Telemetry Bar + Actions */}
          <div className="flex-1 flex justify-center">
            <BottomTelemetryBar telemetry={telemetry} />
          </div>

          {/* Bottom-Right: Spacer to balance layout */}
          <div className="w-48" />
        </div>
      </div>
    </div>
  )
}
