"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapView } from "@/components/map-view"
import dynamic from "next/dynamic"
import { useDroneStore } from "@/lib/drone-store"
import { useTelemetry, deriveTelemetry } from "@/lib/telemetry"
import { WebRTCPlayer } from "@/components/webrtc-player"
import { EmergencyAbort } from "@/components/emergency-abort"
import { useMissionStore } from "@/lib/mission-store"
import {
  AlertTriangle,
  Battery,
  Radio,
  Home,
  Plane,
  NavigationIcon,
  Gauge,
  Wind,
  MapIcon,
  Video,
  Zap,
  Signal
} from "lucide-react"

// Dynamically import map components
const MapView3D = dynamic(
  () => import("@/components/map-view-3d").then((m) => m.MapView3D),
  { ssr: false }
)

export function UnifiedDashboard() {
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find(d => d.id === selectedDrone)
  const activeMissionId = useMissionStore((s) => s.activeMissionId)
  const missions = useMissionStore((s) => s.missions)
  const activeMission = missions.find(m => m.id === activeMissionId)

  const realTelemetry = useTelemetry()
  const telemetry = activeDrone ? deriveTelemetry(activeDrone) : realTelemetry

  const [mapMode, setMapMode] = useState<"2D" | "3D">("2D")

  const hasLiveFeed = !!activeDrone && (!!activeDrone.videoUrl || activeDrone.status === "online" || activeDrone.status === "flying")
  const liveFeedUrl = activeDrone?.videoUrl || "https://www.youtube.com/watch?v=LXb3EKWsInQ"

  const hasLocation = activeDrone?.location && activeDrone.location.lat !== 0
  const mapCenter: [number, number] = hasLocation
    ? [activeDrone!.location!.lat, activeDrone!.location!.lng]
    : [37.7749, -122.4194]

  const currentWaypoints = hasLocation
    ? [{ id: "drone", lat: activeDrone!.location!.lat, lng: activeDrone!.location!.lng, altitude: activeDrone!.location!.altitude ?? 0, action: "current" }]
    : []

  const formatValue = (val: number | undefined) => {
    if (!activeDrone || (activeDrone.status !== "online" && activeDrone.status !== "flying")) return "---"
    return val?.toFixed(1)
  }

  const isFlying = activeDrone?.status === "flying"
  const isArmed = activeDrone?.mode?.toLowerCase().includes("armed") || isFlying
  const batteryLevel = telemetry.battery ?? 0
  const batteryStatus = batteryLevel < 20 ? "critical" : batteryLevel < 40 ? "warning" : "good"

  return (
    <div className="h-full w-full bg-background p-3 flex flex-col gap-3 overflow-hidden">

      {/* Top Status Bar */}
      <div className="flex items-center justify-between gap-4 px-3 py-2 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-4">
          {/* Drone Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full animate-pulse ${isFlying ? "bg-emerald-500" :
              activeDrone?.status === "online" ? "bg-blue-500" :
                "bg-gray-500"
              }`} />
            <span className="text-sm font-semibold">{activeDrone?.name || "No Drone Selected"}</span>
            <Badge variant={isFlying ? "default" : "secondary"} className="text-[10px] h-5">
              {activeDrone?.status?.toUpperCase() || "OFFLINE"}
            </Badge>
          </div>

          {/* Flight Mode */}
          {activeDrone && (
            <div className="flex items-center gap-2 pl-4 border-l">
              <Plane className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">
                {isArmed ? "ARMED" : "DISARMED"} • {isFlying ? "AUTO" : "MANUAL"}
              </span>
            </div>
          )}

          {/* Mission Status */}
          {activeMission && (
            <div className="flex items-center gap-2 pl-4 border-l">
              <NavigationIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">{activeMission.name}</span>
              <Badge variant="outline" className="text-[10px] h-5">
                {activeMission.status}
              </Badge>
            </div>
          )}
        </div>

        {/* Battery & Signal */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Signal className={`h-3.5 w-3.5 ${activeDrone ? "text-emerald-500" : "text-gray-400"}`} />
            <span className="text-xs font-mono">
              {activeDrone ? "STRONG" : "NO SIGNAL"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className={`h-4 w-4 ${batteryStatus === "critical" ? "text-red-500" :
              batteryStatus === "warning" ? "text-yellow-500" :
                "text-emerald-500"
              }`} />
            <span className={`text-sm font-mono font-bold ${batteryStatus === "critical" ? "text-red-500" : ""
              }`}>
              {activeDrone ? `${batteryLevel}%` : "--"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">

        {/* Left: Video Feed */}
        <div className="col-span-7 flex flex-col gap-3 min-h-0">
          <Card className="flex-1 p-0 overflow-hidden bg-black relative">
            {hasLiveFeed ? (
              <WebRTCPlayer
                url={liveFeedUrl}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="space-y-3">
                  <Video className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">No Video Feed</p>
                </div>
              </div>
            )}

            {/* Video Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4">
              {/* Live indicator */}
              <div className="absolute top-4 left-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded backdrop-blur-sm border ${hasLiveFeed
                  ? "bg-red-500/20 border-red-500/30 text-red-500"
                  : "bg-black/40 border-white/10 text-white/50"
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${hasLiveFeed ? "bg-red-500 animate-pulse" : "bg-white/30"}`} />
                  <span className="text-[10px] font-bold tracking-wider">LIVE</span>
                </div>
              </div>

              {/* Artificial Horizon */}
              {activeDrone && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-48 opacity-40">
                  <svg viewBox="0 0 200 140" className="w-full h-full">
                    <g transform={`rotate(${-telemetry.heading} 100 70)`}>
                      <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                      <g transform={`translate(0 ${telemetry.pitch})`}>
                        {[-20, -10, 10, 20].map(deg => (
                          <g key={deg} transform={`translate(0 ${-deg * 2})`} opacity="0.5">
                            <line x1="80" y1="70" x2="120" y2="70" stroke="white" strokeWidth="1" />
                            <text x="125" y="72" fill="white" fontSize="6">{deg}</text>
                          </g>
                        ))}
                      </g>
                    </g>
                    <path d="M90 70 L80 80 M110 70 L120 80 M100 65 L100 75" stroke="#f59e0b" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              )}

              {/* Critical Warnings */}
              {batteryStatus === "critical" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                  <div className="bg-red-500/90 text-white px-6 py-3 rounded-lg border-2 border-red-400 flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                      <p className="font-bold">CRITICAL BATTERY</p>
                      <p className="text-xs">Return to home immediately</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <Button
                size="sm"
                variant={isFlying ? "default" : "outline"}
                className="h-9"
                disabled={!activeDrone || isFlying}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Takeoff
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                disabled={!activeDrone || !isFlying}
              >
                <Home className="h-3.5 w-3.5 mr-1.5" />
                RTH
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 hover:bg-orange-500 hover:text-white hover:border-orange-500"
                disabled={!activeDrone || !isFlying}
              >
                <Plane className="h-3.5 w-3.5 mr-1.5" />
                Land
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                disabled={!activeDrone}
              >
                <Radio className="h-3.5 w-3.5 mr-1.5" />
                Arm
              </Button>
            </div>
          </Card>
        </div>

        {/* Center: Map */}
        <div className="col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 p-0 overflow-hidden relative bg-background">
            {mapMode === "2D" ? (
              <MapView
                waypoints={currentWaypoints}
                selectedWaypoint={hasLocation ? "drone" : null}
                onWaypointClick={() => { }}
                center={hasLocation ? mapCenter : undefined}
                zoom={17}
                heading={telemetry.heading}
                flightPath={activeDrone?.flightPath}
              />
            ) : (
              <MapView3D waypoints={currentWaypoints} />
            )}

            {/* Map Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 shadow-lg"
                onClick={() => setMapMode(mapMode === "2D" ? "3D" : "2D")}
              >
                <MapIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Map Label */}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white/80 font-mono">
              {mapMode} • {hasLocation ? `${telemetry.distance.toFixed(0)}m from home` : "NO GPS"}
            </div>
          </Card>
        </div>

        {/* Right: Telemetry & Status */}
        <div className="col-span-2 flex flex-col gap-3 min-h-0 overflow-y-auto">

          {/* Navigation Data */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <NavigationIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Navigation</span>
            </div>

            {/* Compass */}
            <div className="relative h-24 mb-3">
              <div className="absolute inset-0 rounded-full border border-border" />
              <div className="absolute inset-2 rounded-full border-2 border-primary/30" />
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{ transform: `rotate(${telemetry.heading}deg)` }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-2.5 bg-primary rounded-b" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums">
                    {activeDrone ? telemetry.heading.toFixed(0) : "---"}°
                  </div>
                  <div className="text-[9px] text-muted-foreground">HEADING</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded p-2">
                <div className="text-[9px] text-muted-foreground mb-0.5">ALTITUDE</div>
                <div className="text-lg font-black tabular-nums">{formatValue(telemetry.altitude)}<span className="text-[10px] text-muted-foreground ml-1">m</span></div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-[9px] text-muted-foreground mb-0.5">SPEED</div>
                <div className="text-lg font-black tabular-nums">{formatValue(telemetry.speed)}<span className="text-[10px] text-muted-foreground ml-1">m/s</span></div>
              </div>
            </div>
          </Card>

          {/* Flight Metrics */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Metrics</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Range</span>
                <span className="text-sm font-bold tabular-nums">
                  {activeDrone ? Math.round(telemetry.distance) : "---"}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">V. Speed</span>
                <span className={`text-sm font-bold tabular-nums ${telemetry.verticalSpeed > 0.5 ? "text-emerald-500" :
                  telemetry.verticalSpeed < -0.5 ? "text-orange-500" : ""
                  }`}>
                  {activeDrone ? (telemetry.verticalSpeed > 0 ? "+" : "") + telemetry.verticalSpeed.toFixed(1) : "---"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Pitch</span>
                <span className="text-sm font-bold tabular-nums">{formatValue(telemetry.pitch)}°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Roll</span>
                <span className="text-sm font-bold tabular-nums">{formatValue(telemetry.roll)}°</span>
              </div>
            </div>
          </Card>

          {/* System Status */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Wind className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">System</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">GPS</span>
                <Badge variant={hasLocation ? "default" : "secondary"} className="text-[9px] h-4">
                  {hasLocation ? "LOCKED" : "NO FIX"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Link</span>
                <Badge variant="default" className="text-[9px] h-4">STRONG</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Satellites</span>
                <span className="text-sm font-bold">{hasLocation ? "12" : "--"}</span>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Emergency Abort - Global */}
      <EmergencyAbort />
    </div>
  )
}
