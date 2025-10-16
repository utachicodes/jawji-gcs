"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapView } from "@/components/map-view"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { useDroneStore } from "@/lib/drone-store"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function UnifiedDashboard() {
  // <CHANGE> Fixed to use selectedDrone instead of activeDroneId
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)

  const [telemetry, setTelemetry] = useState({
    altitude: 45.2,
    speed: 5.8,
    heading: 127,
    battery: activeDrone?.battery || 87,
    signal: activeDrone?.signal || 92,
    temperature: 24,
    pitch: 2.3,
    roll: -1.2,
    yaw: 127,
    latitude: 37.7749,
    longitude: -122.4194,
    flightTime: 342,
    flightMode: "AUTO",
  })

  const [altitudeData, setAltitudeData] = useState(
    Array.from({ length: 30 }, (_, i) => ({
      time: i,
      altitude: 40 + Math.random() * 10,
    })),
  )

  // Simulate real-time telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        altitude: Math.max(0, prev.altitude + (Math.random() - 0.5) * 2),
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 0.5),
        heading: (prev.heading + (Math.random() - 0.5) * 5 + 360) % 360,
        pitch: Math.max(-15, Math.min(15, prev.pitch + (Math.random() - 0.5) * 0.5)),
        roll: Math.max(-15, Math.min(15, prev.roll + (Math.random() - 0.5) * 0.5)),
        latitude: prev.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.0001,
        flightTime: prev.flightTime + 1,
      }))

      setAltitudeData((prev) => {
        const newData = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, altitude: telemetry.altitude }]
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [telemetry.altitude])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleJoystickMove = (x: number, y: number) => {
    console.log("[v0] Joystick move:", { x, y })
  }

  return (
    <div className="h-full w-full bg-background p-4 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-4 h-full">
        {/* Main Video Feed - Top Left */}
        <Card className="col-span-7 row-span-7 p-0 overflow-hidden border-border/40">
          <div className="relative w-full h-full bg-black">
            {/* Video placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />

            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
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
                  <div className="bg-black/70 px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">MODE:</span>{" "}
                    <span className="text-white font-bold">{telemetry.flightMode}</span>
                  </div>
                  <div className="bg-black/70 px-3 py-1.5 rounded border border-green-500/30">
                    <span className="text-green-500">GPS:</span>{" "}
                    <span className="text-white">{telemetry.latitude.toFixed(6)}</span>
                  </div>
                  <div className="bg-black/70 px-3 py-1.5 rounded border border-green-500/30">
                    <span className="text-green-500">GPS:</span>{" "}
                    <span className="text-white">{telemetry.longitude.toFixed(6)}</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs text-right">
                  <div className="bg-black/70 px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">ALT:</span>{" "}
                    <span className="text-white font-bold">{telemetry.altitude.toFixed(1)}m</span>
                  </div>
                  <div className="bg-black/70 px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">SPD:</span>{" "}
                    <span className="text-white font-bold">{telemetry.speed.toFixed(1)}m/s</span>
                  </div>
                  <div className="bg-black/70 px-3 py-1.5 rounded border border-primary/30">
                    <span className="text-primary">HDG:</span>{" "}
                    <span className="text-white font-bold">{telemetry.heading.toFixed(0)}°</span>
                  </div>
                </div>
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
                <div className="bg-black/70 px-4 py-2 rounded border border-primary/30 font-mono text-xs">
                  <span className="text-primary">TIME:</span>{" "}
                  <span className="text-white font-bold text-lg">{formatTime(telemetry.flightTime)}</span>
                </div>
                <div className="flex gap-2">
                  <div className="bg-black/70 px-3 py-2 rounded border border-green-500/30 font-mono text-xs">
                    <span className="text-green-500">BAT:</span>{" "}
                    <span className="text-white font-bold">{telemetry.battery}%</span>
                  </div>
                  <div className="bg-black/70 px-3 py-2 rounded border border-green-500/30 font-mono text-xs">
                    <span className="text-green-500">SIG:</span>{" "}
                    <span className="text-white font-bold">{telemetry.signal}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Map View - Top Right */}
        <Card className="col-span-5 row-span-7 p-0 overflow-hidden border-border/40">
          <MapView
            waypoints={[
              {
                id: "drone",
                lat: telemetry.latitude,
                lng: telemetry.longitude,
                altitude: telemetry.altitude,
                action: "current",
              },
            ]}
            selectedWaypoint="drone"
            onWaypointClick={() => {}}
            center={[telemetry.latitude, telemetry.longitude]}
            zoom={16}
          />
        </Card>

        {/* Telemetry Data - Bottom Left */}
        <Card className="col-span-5 row-span-5 p-4 border-border/40 overflow-auto">
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

            <div className="pt-4 border-t border-border/40">
              <div className="text-xs text-muted-foreground mb-2 font-mono">ALTITUDE HISTORY</div>
              <ChartContainer
                config={{
                  altitude: {
                    label: "Altitude",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[120px]"
              >
                <AreaChart data={altitudeData}>
                  <defs>
                    <linearGradient id="fillAlt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-altitude)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-altitude)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="altitude"
                    stroke="var(--color-altitude)"
                    fill="url(#fillAlt)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
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

        {/* Quick Actions - Bottom Right */}
        <Card className="col-span-3 row-span-5 p-4 border-border/40">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold font-mono text-primary">QUICK ACTIONS</h3>
            <div className="space-y-2 font-mono text-xs">
              <Button variant="outline" className="w-full justify-start h-10 bg-transparent" size="sm">
                <span className="font-bold mr-2">RTL</span> Return to Launch
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 bg-transparent" size="sm">
                <span className="font-bold mr-2">HOLD</span> Hold Position
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 bg-transparent" size="sm">
                <span className="font-bold mr-2">AUTO</span> Auto Mode
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 bg-transparent" size="sm">
                <span className="font-bold mr-2">STAB</span> Stabilize
              </Button>
              <Button variant="destructive" className="w-full justify-start h-10 mt-4" size="sm">
                <span className="font-bold mr-2">KILL</span> Emergency Stop
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
