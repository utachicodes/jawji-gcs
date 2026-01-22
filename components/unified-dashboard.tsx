"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { deriveTelemetry } from "@/lib/telemetry"
import { Button } from "@/components/ui/button"
import { MapView } from "@/components/map-view"
import { MapView3D } from "@/components/map-view-3d"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { useDroneStore } from "@/lib/drone-store"
import { Signal, Wifi, Map as MapIcon, Compass, Settings2, Moon, Sun } from "lucide-react"
import { Slider } from "@/components/ui/slider"

const DEFAULT_STREAM_URL = process.env.NEXT_PUBLIC_DEFAULT_VIDEO_STREAM || ""

export function UnifiedDashboard() {
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)

  const telemetry = useMemo(() => deriveTelemetry(activeDrone), [activeDrone])
  const liveFeedUrl = (activeDrone?.videoUrl || DEFAULT_STREAM_URL || "").trim() || null
  const hasLiveFeed = Boolean(liveFeedUrl)
  const location = activeDrone?.location
  const hasLocation = Boolean(location && Number.isFinite(location.lat) && Number.isFinite(location.lng))

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
  const mapCenter = useMemo(() => hasLocation ? ([location!.lat, location!.lng] as [number, number]) : undefined, [hasLocation, location])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleJoystickMove = (x: number, y: number) => {
    // console.log("[JAWJI] Joystick move:", { x, y })
  }

  const [mapMode, setMapMode] = useState<"2D" | "3D">("2D")
  const [follow] = useState<boolean>(true)
  const [recording] = useState<boolean>(true)

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
  } as const

  return (
    <motion.div
      className="h-full w-full bg-transparent overflow-hidden text-foreground font-sans p-2 flex flex-col gap-2"
      variants={containerVariants}
      initial="show"
      animate="show"
    >
      {/* --- TOP SECTION (Video + Status) --- */}
      <div className="flex-1 flex gap-2 min-h-0">

        {/* MAIN VIDEO FEED (Dominant) */}
        <motion.div
          className="flex-[3] relative rounded-2xl overflow-hidden border border-border bg-black shadow-2xl group flex flex-col"
          variants={itemVariants}
        >
          {/* Video Layer */}
          <div className="flex-1 relative bg-black">
            {hasLiveFeed ? (
              <video
                key={liveFeedUrl}
                src={liveFeedUrl!}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                controls={false}
              />
            ) : (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-center space-y-4 opacity-50">
                  <div className="w-20 h-20 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Wifi className="w-10 h-10 text-white/40" />
                  </div>
                  <p className="text-sm tracking-[0.25em] font-mono text-white/40">NO SIGNAL</p>
                </div>
              </div>
            )}

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

            {/* HUD Overlay Layer */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              {/* Top Bar */}
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded text-xs font-medium text-white/80 uppercase tracking-wider">
                    Live Feed
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded text-xs font-mono text-yellow-400">
                    4K • 60FPS
                  </div>
                </div>
                <div className="flex gap-2">
                  {recording && (
                    <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="font-mono text-xs font-bold text-white">{formatTime(telemetry.flightTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="w-16 h-16 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/60 rounded-full"></div>
                </div>
                <div className="absolute w-96 h-64 border-l border-r border-white/20 rounded-2xl" />
              </div>

              {/* Corners SVG */}
              <svg className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)] pointer-events-none opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M50 0 H0 V50" className="text-white/60" />
                <path d="M0 calc(100% - 50px) V100% H50" className="text-white/60" />
                <path d="Mcalc(100% - 50px) 100% H100% Vcalc(100% - 50px)" className="text-white/60" />
                <path d="M100% 50 V0 Hcalc(100% - 50px)" className="text-white/60" />
              </svg>

              {/* Bottom Info */}
              <div className="flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-2 font-mono text-[10px] text-white/80 space-y-1 w-32">
                  <div className="flex justify-between"><span>ISO</span> <span className="text-white">800</span></div>
                  <div className="flex justify-between"><span>SHUTTER</span> <span className="text-white">1/120</span></div>
                  <div className="flex justify-between"><span>IRIS</span> <span className="text-white">F2.8</span></div>
                  <div className="flex justify-between"><span>EV</span> <span className="text-white">+0.0</span></div>
                </div>

                {/* Subject Tracker */}
                <div className="w-20 h-20 border border-yellow-400/30 rounded-lg flex items-center justify-center relative">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-400" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-400" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-400" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-400" />
                  <span className="text-[10px] text-yellow-400 font-mono tracking-widest bg-black/50 px-1.5 py-0.5 rounded">LOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATUS PANEL (Right Side) */}
        <motion.div
          className="flex-1 max-w-[320px] rounded-2xl bg-card border border-border p-4 flex flex-col gap-4 shadow-sm min-h-0 overflow-y-auto"
          variants={itemVariants}
        >
          {/* Drone Header */}
          <div className="shrink-0 space-y-1">
            <div className="flex justify-between items-start">
              <h2 className="text-base font-bold tracking-tight text-foreground uppercase truncate">{activeDrone?.name || "JAWJI Drone"}</h2>
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse shrink-0">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {activeDrone?.model || "Mavic 3 Enterprise"}
            </p>
          </div>

          <div className="h-px bg-border/50 w-full shrink-0" />

          {/* Connection & GPS Status */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="bg-secondary/30 rounded-lg p-3 flex flex-col gap-1 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Signal className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">RC Link</span>
              </div>
              <span className="text-sm font-mono font-bold text-foreground">HD {telemetry.signal}%</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 flex flex-col gap-1 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Compass className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">GPS</span>
              </div>
              <span className="text-sm font-mono font-bold text-foreground">{telemetry.gpsCount} SAT</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 flex flex-col gap-1 border border-border/50 col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Flight Mode</span>
              </div>
              <span className="text-sm font-mono font-bold text-primary">{telemetry.flightMode}</span>
            </div>
          </div>

          {/* Battery Status */}
          <div className="space-y-2 shrink-0 bg-secondary/10 p-3 rounded-xl border border-border/30">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-wide">Battery</span>
              <span className={telemetry.battery < 20 ? "text-red-500" : "text-green-500"}>{telemetry.battery}%</span>
            </div>
            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
              <div
                className={`h-full rounded-full ${telemetry.battery < 20 ? "bg-red-500" : "bg-gradient-to-r from-green-600 to-green-400"} transition-all duration-500`}
                style={{ width: `${telemetry.battery}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>22.4V</span>
              <span>~18 min fly time</span>
            </div>
          </div>

          <div className="flex-1 min-h-[20px]" />

          {/* Limit Sliders */}
          <div className="flex flex-col gap-4 shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Max Altitude</span>
                <span className="font-mono text-foreground">120m</span>
              </div>
              <Slider defaultValue={[120]} max={500} step={10} className="py-1" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>RTH Height</span>
                <span className="font-mono text-foreground">80m</span>
              </div>
              <Slider defaultValue={[80]} max={200} step={5} className="py-1" />
            </div>
          </div>

          <div className="h-px bg-border/50 w-full shrink-0" />

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <Button variant="outline" size="sm" className="w-full h-9 rounded-lg bg-secondary/50 border-input hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
              <Sun className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="w-full h-9 rounded-lg bg-secondary/50 border-input hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
              <Moon className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="w-full h-9 rounded-lg bg-secondary/50 border-input hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* --- BOTTOM SECTION (Controls) --- */}
      <div className="h-[240px] shrink-0 flex gap-2">
        {/* 1. MAP CARD */}
        <motion.div
          className="flex-1 rounded-2xl overflow-hidden border border-border bg-card shadow-sm relative group"
          variants={itemVariants}
        >
          {/* Map Toggle Header */}
          <div className="absolute top-3 left-3 right-3 z-[400] flex justify-between pointer-events-none">
            <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 shadow-lg">
              {mapMode === "2D" ? "Satellite" : "3D Path"}
            </div>
            <Button size="icon" variant="secondary" className="pointer-events-auto w-8 h-8 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-md border border-border shadow-lg" onClick={() => setMapMode(m => m === "2D" ? "3D" : "2D")}>
              <MapIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-full h-full">
            {mapMode === "2D" ? (
              <MapView
                waypoints={currentWaypoints}
                selectedWaypoint={hasLocation ? "drone" : null}
                onWaypointClick={() => { }}
                center={follow && hasLocation ? mapCenter : undefined}
                zoom={17}
                heading={telemetry.heading}
              />
            ) : (
              <div className="p-0 h-full">
                <MapView3D waypoints={currentWaypoints} />
              </div>
            )}
          </div>
        </motion.div>

        {/* 2. TELEMETRY DECK */}
        <motion.div
          className="flex-[2] rounded-2xl bg-card border border-border p-5 flex flex-col justify-between shadow-sm relative overflow-hidden"
          variants={itemVariants}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:20px_20px] text-foreground" />

          {/* Mode Tabs */}
          <div className="flex gap-3 mb-2 z-10">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md transition-transform active:scale-95">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Pro Video
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground text-xs font-medium transition-colors border border-border">
              Single Shot
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-6 z-10">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">H. Speed</div>
              <div className="text-3xl font-mono text-foreground font-medium tracking-tighter">{telemetry.speed.toFixed(1)} <span className="text-sm text-muted-foreground font-sans font-normal">km/h</span></div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Altitude</div>
              <div className="text-3xl font-mono text-foreground font-medium tracking-tighter">{telemetry.altitude.toFixed(1)} <span className="text-sm text-muted-foreground font-sans font-normal">m</span></div>
            </div>
            <div className="space-y-1 border-l border-border pl-6">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Distance</div>
              <div className="text-3xl font-mono text-foreground font-medium tracking-tighter">1.2 <span className="text-sm text-muted-foreground font-sans font-normal">km</span></div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">V. Speed</div>
              <div className="text-3xl font-mono text-foreground font-medium tracking-tighter">+0.5 <span className="text-sm text-muted-foreground font-sans font-normal">m/s</span></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 flex justify-between items-end border-t border-border z-10">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Flight Time</div>
              <div className="text-lg font-mono text-foreground">{formatTime(telemetry.flightTime)}</div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">GNSS Coordinates</div>
              <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {hasLocation ? `${location?.lat.toFixed(6)}, ${location?.lng.toFixed(6)}` : "ACQUIRING SATELLITES..."}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. COMPASS & CONTROLS */}
        <motion.div
          className="flex-1 rounded-2xl bg-card border border-border relative p-4 flex flex-col items-center justify-center overflow-hidden shadow-sm"
          variants={itemVariants}
        >
          {/* Compass Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Compass className="w-56 h-56 text-foreground" strokeWidth={0.5} />
          </div>

          {/* Virtual Joystick embedded centrally */}
          <div className="relative z-10 scale-90">
            <VirtualJoystick onMove={handleJoystickMove} />
          </div>

          {/* Heading Indicator top */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-popover/90 backdrop-blur border border-border text-foreground px-3 py-1 rounded-full text-[10px] font-bold font-mono shadow-md">
            HEAD {telemetry.heading.toFixed(0)}°
          </div>

          {/* Control Buttons (Corners) */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Button variant="outline" size="icon" className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent w-9 h-9 bg-background/60 backdrop-blur-md border-border shadow-sm">
              <span className="text-[9px] font-bold">RTH</span>
            </Button>
            <Button variant="outline" size="icon" className="text-green-500 hover:text-green-400 rounded-full hover:bg-green-500/10 w-9 h-9 bg-background/60 backdrop-blur-md border-green-500/30 shadow-sm">
              <span className="text-[9px] font-bold">ARM</span>
            </Button>
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Button variant="outline" size="icon" className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent w-9 h-9 bg-background/60 backdrop-blur-md border-border shadow-sm">
              <span className="text-[9px] font-bold">LAND</span>
            </Button>
            <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-400 rounded-full hover:bg-blue-500/10 w-9 h-9 bg-background/60 backdrop-blur-md border-blue-500/30 shadow-sm">
              <span className="text-[8px] font-bold">LIFT</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
