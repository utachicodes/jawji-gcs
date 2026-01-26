"use client"

import { useMemo, useState } from "react"
import { deriveTelemetry } from "@/lib/telemetry"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapView } from "@/components/map-view"
import { MapView3D } from "@/components/map-view-3d"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { useDroneStore } from "@/lib/drone-store"

const DEFAULT_STREAM_URL = process.env.NEXT_PUBLIC_DEFAULT_VIDEO_STREAM || ""

export function UnifiedDashboard() {
  // <CHANGE> Fixed to use selectedDrone instead of activeDroneId
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)

  const telemetry = useMemo(() => deriveTelemetry(activeDrone), [activeDrone])
  const liveFeedUrl = (activeDrone?.videoUrl || DEFAULT_STREAM_URL || "").trim() || null
  const hasLiveFeed = Boolean(liveFeedUrl)
  const location = activeDrone?.location
  const hasLocation = Boolean(location && Number.isFinite(location.lat) && Number.isFinite(location.lng))
  const latText = hasLocation ? location!.lat.toFixed(6) : "—"
  const lngText = hasLocation ? location!.lng.toFixed(6) : "—"
  const altitudeValue = Number.isFinite(location?.altitude) ? (location?.altitude as number) : telemetry.altitude
  const waypointAltitude = Number.isFinite(location?.altitude) ? (location?.altitude as number) : telemetry.altitude
  const currentWaypoints = hasLocation
    ? [
      {
        id: "drone",
        lat: location!.lat,
        lng: location!.lng,
        altitude: waypointAltitude,
        action: "current",
      },
    ]
    : []
  const mapCenter = useMemo(() => {
    return hasLocation ? ([location!.lat, location!.lng] as [number, number]) : undefined
  }, [hasLocation, location?.lat, location?.lng])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleJoystickMove = (x: number, y: number) => {
    console.log("[JAWJI] Joystick move:", { x, y })
  }

  const [mapMode, setMapMode] = useState<"2D" | "3D">("2D")
  const [follow, setFollow] = useState<boolean>(true)
  const [recording] = useState<boolean>(true)

  return (
    <div className="h-full w-full bg-background p-2 flex flex-col overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Column - Video & Map (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Main Video Feed - Flex Grow to take available space */}
          <Card className="flex-1 p-0 overflow-hidden border-border flex flex-col min-h-0">
            <div className="relative flex-1 bg-black min-h-0">
              {/* Video / live feed */}
              {hasLiveFeed ? (
                <div className="absolute inset-0">
                  <video
                    key={liveFeedUrl}
                    src={liveFeedUrl!}
                    className="h-full w-full object-cover"
                    autoPlay
                    playsInline
                    muted
                    controls
                    poster="/placeholder.jpg"
                  />
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="bg-black/70 border border-red-500/60 text-red-400 text-[10px] font-semibold tracking-[0.2em] px-3 py-1 rounded-full">
                      LIVE FEED
                    </span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-white/80 font-mono uppercase tracking-[0.3em] text-xs">Awaiting live feed</p>
                    <p className="text-white/60 text-xs max-w-xs mx-auto">
                      Provide a `videoUrl` in telemetry or set `NEXT_PUBLIC_DEFAULT_VIDEO_STREAM`.
                    </p>
                  </div>
                </div>
              )}

              {/* HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative w-8 h-8 opacity-50">
                    <div className="absolute top-1/2 left-0 w-3 h-[1px] bg-primary" />
                    <div className="absolute top-1/2 right-0 w-3 h-[1px] bg-primary" />
                    <div className="absolute left-1/2 top-0 w-[1px] h-3 bg-primary" />
                    <div className="absolute left-1/2 bottom-0 w-[1px] h-3 bg-primary" />
                  </div>
                </div>

                {/* Compass & Horizon minimal overlay */}
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur rounded-lg p-2 flex gap-4">
                  <span className="text-white font-mono text-xs">HDG {telemetry.heading.toFixed(0)}°</span>
                  <span className="text-white font-mono text-xs">ALT {altitudeValue.toFixed(1)}m</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Map View - Fixed height relative to viewport, e.g. 35% */}
          <Card className="h-[35%] p-0 overflow-hidden border-border flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/60 gap-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">MAP</div>
              <div className="flex gap-1 items-center">
                <Button size="sm" variant={mapMode === "2D" ? "default" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setMapMode("2D")}>2D</Button>
                <Button size="sm" variant={mapMode === "3D" ? "default" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setMapMode("3D")}>3D</Button>
                <Button size="sm" variant={follow ? "default" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setFollow((f) => !f)}>{follow ? "Lock" : "Free"}</Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 relative">
              {mapMode === "2D" ? (
                <MapView
                  waypoints={currentWaypoints}
                  selectedWaypoint={hasLocation ? "drone" : null}
                  onWaypointClick={() => { }}
                  center={follow && hasLocation ? mapCenter : undefined}
                  zoom={16}
                  heading={telemetry.heading}
                />
              ) : (
                <div className="p-2 h-full">
                  <MapView3D waypoints={currentWaypoints} />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Controls & Data (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          {/* Telemetry Grid */}
          <Card className="p-4 border-border shrink-0">
            <h3 className="text-xs font-semibold font-mono text-primary mb-3">TELEMETRY</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground">ALTITUDE (m)</div>
                <div className="text-xl font-bold font-mono">{telemetry.altitude.toFixed(1)}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground">SPEED (m/s)</div>
                <div className="text-xl font-bold font-mono">{telemetry.speed.toFixed(1)}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground">BATTERY</div>
                <div className={`text-xl font-bold font-mono ${telemetry.battery < 20 ? 'text-red-500' : 'text-green-500'}`}>{telemetry.battery}%</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground">SIGNAL</div>
                <div className="text-xl font-bold font-mono">{telemetry.signal}%</div>
              </div>
            </div>
          </Card>

          {/* Artificial Horizon / Compass Combo */}
          <Card className="p-4 border-border shrink-0 flex items-center justify-center min-h-[180px]">
            <div className="relative w-40 h-40">
              {/* Simple compass ring */}
              <div className="absolute inset-0 border-2 border-muted rounded-full opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold">
                {telemetry.heading.toFixed(0)}°
              </div>
              {/* Heading triangle */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-primary" />
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">HEADING</div>
            </div>
          </Card>

          {/* Manual Control - Takes remaining space */}
          <Card className="flex-1 p-4 border-border flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <h3 className="text-xs font-semibold font-mono text-primary">MANUAL CONTROL</h3>
            <div className="flex-1 flex items-center justify-center w-full">
              <VirtualJoystick onMove={handleJoystickMove} />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full font-mono text-[10px]">
              <Button variant="outline" size="sm" className="h-8">ARM</Button>
              <Button variant="outline" size="sm" className="h-8">DISARM</Button>
              <Button variant="outline" size="sm" className="h-8">TAKEOFF</Button>
              <Button variant="outline" size="sm" className="h-8">LAND</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
