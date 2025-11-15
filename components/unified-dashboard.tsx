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
  const mapCenter = hasLocation ? ([location!.lat, location!.lng] as [number, number]) : undefined

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
    <div className="h-full w-full bg-background p-4 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-4 h-full">
        {/* Main Video Feed - Top Left */}
        <Card className="col-span-7 row-span-7 p-0 overflow-hidden border-border/40 flex flex-col">
          <div className="relative w-full flex-1 min-h-0 min-h-[300px] bg-black">
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
                    Provide a `videoUrl` in the incoming telemetry payload or set `NEXT_PUBLIC_DEFAULT_VIDEO_STREAM` to render the camera feed.
                  </p>
                </div>
              </div>
            )}

            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 3x3 Grid */}
              {["33.333%","66.666%"].map((pos) => (
                <div key={`v-${pos}`} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: pos }} />
              ))}
              {["33.333%","66.666%"].map((pos) => (
                <div key={`h-${pos}`} className="absolute left-0 right-0 h-px bg-white/10" style={{ top: pos }} />
              ))}

              {/* Crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative w-12 h-12">
                  <div className="absolute top-1/2 left-0 w-4 h-[2px] bg-primary" />
                  <div className="absolute top-1/2 right-0 w-4 h-[2px] bg-primary" />
                  <div className="absolute left-1/2 top-0 w-[2px] h-4 bg-primary" />
                  <div className="absolute left-1/2 bottom-0 w-[2px] h-4 bg-primary" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border-2 border-primary rounded-full" />
                </div>
              </div>

              {/* Top HUD Info */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="space-y-1 font-mono text-xs">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">MODE:</span>{" "}
                    <span className="text-white font-bold">{telemetry.flightMode}</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded border border-green-500/30">
                    <span className="text-green-500">GPS:</span>{" "}
                    <span className="text-white">{latText}</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded border border-green-500/30">
                    <span className="text-green-500">GPS:</span>{" "}
                    <span className="text-white">{lngText}</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs text-right">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">ALT:</span>{" "}
                    <span className="text-white font-bold">{altitudeValue.toFixed(1)}m</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">SPD:</span>{" "}
                    <span className="text-white font-bold">{telemetry.speed.toFixed(1)}m/s</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">HDG:</span>{" "}
                    <span className="text-white font-bold">{telemetry.heading.toFixed(0)}°</span>
                  </div>
                </div>
              </div>

              {/* Recording indicator */}
              {recording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-black/60 backdrop-blur-sm border border-red-500/40 px-3 py-1.5 rounded-full font-mono text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white">{formatTime(telemetry.flightTime)}</span>
                  </div>
                </div>
              )}

              {/* Left camera stack */}
              <div className="absolute top-4 left-4 bottom-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="px-2 py-1 rounded bg-black/60 border border-white/10 text-[10px] font-semibold text-white w-min">HDR</div>
                  <div className="px-2 py-1 rounded bg-black/60 border border-white/10 text-[10px] text-muted-foreground w-min">4K • 24 FPS</div>
                  <div className="px-2 py-1 rounded bg-black/60 border border-white/10 text-[10px] text-muted-foreground w-min">LEVEL</div>
                  <div className="grid grid-cols-2 gap-1 w-[96px]">
                    {[
                      { k: "R", c: "#ef4444" },
                      { k: "G", c: "#22c55e" },
                      { k: "B", c: "#3b82f6" },
                      { k: "Y", c: "#f59e0b" },
                    ].map((item) => (
                      <div key={item.k} className="flex items-center justify-between px-2 py-1 rounded bg-black/60 border border-white/10 text-[10px]">
                        <span style={{ color: item.c as string }} className="font-semibold">{item.k}</span>
                        <span className="text-muted-foreground">●</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-[110px] h-[64px] rounded border border-white/10 bg-gradient-to-b from-white/10 to-transparent" />
              </div>

              {/* Artificial Horizon */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2">
                <div className="relative w-24 h-24 border-2 border-primary/50 rounded-full bg-black/50">
                  <div
                    className="absolute inset-2 border-t-2 border-primary"
                    style={{ transform: `rotate(${telemetry.roll}deg)` }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full" />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[10px] text-primary">
                    {telemetry.pitch.toFixed(1)}°
                  </div>
                </div>
              </div>

              {/* Compass */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <div className="relative w-24 h-24 border-2 border-primary/50 rounded-full bg-black/50">
                  <div
                    className="absolute inset-0 flex items-start justify-center pt-2"
                    style={{ transform: `rotate(${telemetry.heading}deg)` }}
                  >
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-sm text-primary font-bold">
                    {telemetry.heading.toFixed(0)}°
                  </div>
                </div>
              </div>

              {/* Bottom Status Bar */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded border border-primary/30 font-mono text-xs">
                  <span className="text-primary">TIME:</span>{" "}
                  <span className="text-white font-bold text-lg">{formatTime(telemetry.flightTime)}</span>
                </div>
                <div className="flex gap-2">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded border border-green-500/30 font-mono text-xs">
                    <span className="text-green-500">BAT:</span>{" "}
                    <span className="text-white font-bold">{telemetry.battery}%</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded border border-green-500/30 font-mono text-xs">
                    <span className="text-green-500">SIG:</span>{" "}
                    <span className="text-white font-bold">{telemetry.signal}%</span>
                  </div>
                </div>
              </div>

              {/* Subject box */}
              <div className="absolute border-2 border-yellow-400/80 rounded-sm" style={{ width: 80, height: 60, left: "60%", top: "38%" }} />
            </div>
          </div>
        </Card>

        {/* Map View - Top Right */}
        <Card className="col-span-5 row-span-7 p-0 overflow-hidden border-border/40 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="text-xs font-mono text-muted-foreground">MAP MODE</div>
            <div className="flex gap-1">
              <Button size="sm" variant={mapMode === "2D" ? "default" : "outline"} className="h-7" onClick={() => setMapMode("2D")}>
                2D
              </Button>
              <Button size="sm" variant={mapMode === "3D" ? "default" : "outline"} className="h-7" onClick={() => setMapMode("3D")}>
                3D
              </Button>
              <Button size="sm" variant={follow ? "default" : "outline"} className="h-7" onClick={() => setFollow((f) => !f)}>
                {follow ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 min-h-[300px]">
            {mapMode === "2D" ? (
              <MapView
                waypoints={currentWaypoints}
                selectedWaypoint={hasLocation ? "drone" : null}
                onWaypointClick={() => {}}
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

        {/* Telemetry Data - Bottom Left */}
        <Card className="col-span-5 row-span-5 p-4 border-border/40">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold font-mono text-primary">TELEMETRY DATA</h3>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">ALTITUDE</div>
                <div className="text-2xl font-bold">{telemetry.altitude.toFixed(1)}</div>
                <div className="text-muted-foreground">meters AGL</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">SPEED</div>
                <div className="text-2xl font-bold">{telemetry.speed.toFixed(1)}</div>
                <div className="text-muted-foreground">m/s</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">HEADING</div>
                <div className="text-2xl font-bold">{telemetry.heading.toFixed(0)}°</div>
                <div className="text-muted-foreground">true north</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">TEMPERATURE</div>
                <div className="text-2xl font-bold">{telemetry.temperature}°</div>
                <div className="text-muted-foreground">celsius</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">PITCH</div>
                <div className="text-2xl font-bold">{telemetry.pitch.toFixed(1)}°</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">ROLL</div>
                <div className="text-2xl font-bold">{telemetry.roll.toFixed(1)}°</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Flight Controls - Bottom Center */}
        <Card className="col-span-4 row-span-5 p-4 border-border/40 flex flex-col items-center justify-center gap-4">
          <h3 className="text-sm font-semibold font-mono text-primary">MANUAL CONTROL</h3>
          <VirtualJoystick onMove={handleJoystickMove} />
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs font-mono text-xs">
            <Button variant="outline" size="sm" className="h-12 bg-transparent">
              ARM
            </Button>
            <Button variant="outline" size="sm" className="h-12 bg-transparent">
              DISARM
            </Button>
            <Button variant="outline" size="sm" className="h-12 bg-transparent">
              TAKEOFF
            </Button>
            <Button variant="outline" size="sm" className="h-12 bg-transparent">
              LAND
            </Button>
          </div>
        </Card>

        {/* Compass Card - Bottom Right */}
        <Card className="col-span-3 row-span-5 p-4 border-border/40 flex items-center justify-center">
          <div className="relative w-56 h-56 rounded-full border border-border/50 bg-black/40">
            {/* ticks */}
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => (
              <div key={deg} className="absolute left-1/2 top-1/2 origin-bottom" style={{ transform: `rotate(${deg}deg) translate(-50%, -100%)` }}>
                <div className="w-[2px] h-3 bg-white/30" />
              </div>
            ))}
            {/* pointer */}
            <div className="absolute inset-0 flex items-start justify-center pt-4" style={{ transform: `rotate(${telemetry.heading}deg)` }}>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[14px] border-l-transparent border-r-transparent border-b-red-500" />
            </div>
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold font-mono">{telemetry.heading.toFixed(0)}°</div>
              <div className="text-xs text-muted-foreground">HEADING</div>
            </div>
            {/* cardinal letters */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 text-xs font-semibold">N</div>
            <div className="absolute right-1/2 translate-x-1/2 bottom-1 text-xs font-semibold">S</div>
            <div className="absolute top-1/2 -translate-y-1/2 right-1 text-xs font-semibold">E</div>
            <div className="absolute top-1/2 -translate-y-1/2 left-1 text-xs font-semibold">W</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
