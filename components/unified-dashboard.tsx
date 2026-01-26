"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapView } from "@/components/map-view"
import dynamic from "next/dynamic"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { useDroneStore } from "@/lib/drone-store"
import { useTelemetry, deriveTelemetry } from "@/lib/telemetry"
import { WebRTCPlayer } from "@/components/webrtc-player"

// Dynamically import map components to avoid SSR issues with Leaflet
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
  const [follow, setFollow] = useState(true)

  // Show live feed if we have a URL OR if the drone is active (simulated feed)
  const hasLiveFeed = !!activeDrone && (!!activeDrone.videoUrl || activeDrone.status === "online" || activeDrone.status === "flying")
  // Aerial drone footage for immersive view or use provided URL
  const liveFeedUrl = activeDrone?.videoUrl || "https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_30fps.mp4"

  const hasLocation = activeDrone?.location && activeDrone.location.lat !== 0
  const mapCenter: [number, number] = hasLocation
    ? [activeDrone!.location!.lat, activeDrone!.location!.lng]
    : [37.7749, -122.4194]

  // Fix: Explicitly include altitude to satisfy Waypoint types
  const currentWaypoints = hasLocation
    ? [{ id: "drone", lat: activeDrone!.location!.lat, lng: activeDrone!.location!.lng, altitude: activeDrone!.location!.altitude ?? 0, action: "current" }]
    : []

  const handleJoystickMove = (x: number, y: number) => {
    console.log(`Joystick: ${x}, ${y}`)
  }

  const formatValue = (val: number | undefined, loading = false) => {
    if (!activeDrone || loading || (activeDrone.status !== "online" && activeDrone.status !== "flying")) return "---"
    return val?.toFixed(1)
  }

  return (
    <div className="h-full w-full bg-background/50 p-4 flex flex-col overflow-hidden">

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">

        {/* Left Column: MAIN VIEW (Video + Context) */}
        <div className="lg:col-span-9 flex flex-col gap-4 min-h-0 relative">

          <Card className="flex-1 p-0 overflow-hidden border-border/50 bg-black/5 relative group rounded-xl shadow-sm">
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
              {hasLiveFeed ? (
                <WebRTCPlayer
                  url={liveFeedUrl}
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-2 border-white/10 border-t-white/50 rounded-full animate-spin mx-auto mb-4" />
                  <div>
                    <p className="text-white/40 font-mono text-xs tracking-[0.2em] uppercase">No Video Feed</p>
                    <p className="text-white/20 text-[10px] mt-1">WAITING FOR TRANSMISSION</p>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute inset-0 pointer-events-none p-6">

              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={`bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-2 backdrop-blur-sm transition-opacity ${hasLiveFeed ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-2 h-2 rounded-full bg-red-500 ${hasLiveFeed ? 'animate-pulse' : ''}`} />
                    LIVE
                  </div>
                  <div className="bg-black/40 text-white/70 border border-white/10 px-2 py-1 rounded text-[10px] font-mono backdrop-blur-sm">
                    HD • 30FPS
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 opacity-40">
                <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                  <g transform={`rotate(${-telemetry.heading} 100 70)`}>
                    <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                    <g transform={`translate(0 ${telemetry.pitch})`}>
                      {[-20, -10, 10, 20].map(deg => (
                        <g key={deg} transform={`translate(0 ${-deg * 2}) opacity(0.5)`}>
                          <line x1="80" y1="70" x2="120" y2="70" stroke="white" strokeWidth="1" />
                          <text x="125" y="72" fill="white" fontSize="6" fontFamily="monospace">{deg}</text>
                        </g>
                      ))}
                    </g>
                  </g>
                  <path d="M90 70 L80 80 M110 70 L120 80 M100 65 L100 75" stroke="#f59e0b" strokeWidth="2" fill="none" />
                </svg>
              </div>

              <div className="absolute bottom-6 left-6 pointer-events-auto">
                <div className="w-64 h-48 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden shadow-2xl transition-all hover:w-[500px] hover:h-[350px] hover:border-white/20 group/map relative">
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/map:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white/80 hover:bg-white/20" onClick={() => setMapMode(mapMode === "2D" ? "3D" : "2D")}>
                      <div className="text-[10px] font-bold">{mapMode}</div>
                    </Button>
                  </div>
                  {mapMode === "2D" ? (
                    <MapView
                      waypoints={currentWaypoints}
                      selectedWaypoint={hasLocation ? "drone" : null}
                      onWaypointClick={() => { }}
                      center={follow && hasLocation ? mapCenter : undefined}
                      zoom={17}
                      heading={telemetry.heading}
                      flightPath={activeDrone?.flightPath}
                    />
                  ) : (
                    <MapView3D waypoints={currentWaypoints} />
                  )}

                  <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute bottom-1 left-2 text-[9px] text-white/50 font-mono pointer-events-none">
                    MAP VIEW • {follow ? "LOCKED" : "FREE"}
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Right Column: INSTRUMENTS & CONTROLS */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">

          <div className="flex-1 flex flex-col gap-3">

            <Card className="p-4 bg-card/80 backdrop-blur border-border/60 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  FLIGHT DATA
                </h3>
              </div>

              <div className="h-32 relative flex items-center justify-center my-2">
                <div className="absolute inset-0 rounded-full border border-dashed border-muted-foreground/20" />
                <div className="absolute inset-2 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0" style={{ transform: `rotate(${telemetry.heading}deg)`, transition: 'transform 0.5s ease-out' }}>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-3 bg-primary/80 clip-path-triangle" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                </div>
                <div className="text-center z-10">
                  <div className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
                    {activeDrone && (activeDrone.status === "online" || activeDrone.status === "flying") ? telemetry.heading.toFixed(0) : "---"}°
                  </div>
                  <div className="text-[9px] font-bold text-muted-foreground uppercase">Heading</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 rounded-lg p-3 border border-border/50 shadow-sm">
                  <div className="text-[9px] uppercase text-muted-foreground mb-1 font-semibold tracking-wider">Altitude</div>
                  <div className="text-xl font-black tabular-nums leading-none tracking-tight">{formatValue(telemetry.altitude)}<span className="text-[10px] text-muted-foreground ml-1 font-normal">m</span></div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border/50 shadow-sm">
                  <div className="text-[9px] uppercase text-muted-foreground mb-1 font-semibold tracking-wider">Speed</div>
                  <div className="text-xl font-black tabular-nums leading-none tracking-tight">{formatValue(telemetry.speed)}<span className="text-[10px] text-muted-foreground ml-1 font-normal">m/s</span></div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border/50 shadow-sm">
                  <div className="text-[9px] uppercase text-muted-foreground mb-1 font-semibold tracking-wider">Range</div>
                  <div className="text-xl font-black tabular-nums leading-none tracking-tight">{activeDrone && (activeDrone.status === "online" || activeDrone.status === "flying") ? Math.round(telemetry.distance) : "---"}<span className="text-[10px] text-muted-foreground ml-1 font-normal">m</span></div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border/50 shadow-sm">
                  <div className="text-[9px] uppercase text-muted-foreground mb-1 font-semibold tracking-wider">V. Speed</div>
                  <div className={`text-xl font-black tabular-nums leading-none tracking-tight ${telemetry.verticalSpeed > 0.5 ? "text-emerald-500" : telemetry.verticalSpeed < -0.5 ? "text-orange-500" : ""}`}>
                    {activeDrone && (activeDrone.status === "online" || activeDrone.status === "flying") ? (telemetry.verticalSpeed > 0 ? "+" : "") + telemetry.verticalSpeed.toFixed(1) : "---"}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="flex-1 p-4 bg-card/80 backdrop-blur border-border/60 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-4 flex items-center gap-2">
                <div className="i-lucide-gamepad-2 w-3 h-3" />
                MANUAL OVERRIDE
              </h3>

              <div className="flex-1 relative flex items-center justify-center p-4 rounded-xl border border-border/10 mb-4 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5">
                <VirtualJoystick onMove={handleJoystickMove} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold hover:bg-secondary hover:text-foreground transition-colors">RTH</Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-colors">LAND</Button>
                <Button variant="default" size="sm" className="h-8 text-[10px] font-bold col-span-2 shadow-lg shadow-primary/20">TAKEOFF</Button>
              </div>
            </Card>

          </div>
        </div>

      </div>
    </div>
  )
}
