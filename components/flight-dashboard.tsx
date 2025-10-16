"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Gauge,
  Navigation2,
  Wind,
  Thermometer,
  Battery,
  Signal,
  Camera,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function FlightDashboard() {
  const [telemetry, setTelemetry] = useState({
    altitude: 45.2,
    speed: 5.8,
    heading: 127,
    battery: 87,
    signal: 92,
    temperature: 24,
    satellites: 0,
    flightTime: 342,
  })

  const [altitudeData, setAltitudeData] = useState(
    Array.from({ length: 20 }, (_, i) => ({
      time: i,
      altitude: 40 + Math.random() * 10,
    })),
  )

  const [speedData, setSpeedData] = useState(
    Array.from({ length: 20 }, (_, i) => ({
      time: i,
      speed: 5 + Math.random() * 2,
    })),
  )

  // Simulate real-time telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        altitude: prev.altitude + (Math.random() - 0.5) * 2,
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 0.5),
        heading: (prev.heading + Math.random() * 5) % 360,
        flightTime: prev.flightTime + 1,
      }))

      setAltitudeData((prev) => {
        const newData = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, altitude: telemetry.altitude }]
        return newData
      })

      setSpeedData((prev) => {
        const newData = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, speed: telemetry.speed }]
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [telemetry.altitude, telemetry.speed])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="h-full p-6 space-y-6 overflow-auto">
      {/* Status Banner */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">Flight Active</h3>
            <p className="text-sm text-muted-foreground">Mission: Survey Mission 01</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Flight Time</div>
            <div className="text-2xl font-mono font-bold">{formatTime(telemetry.flightTime)}</div>
          </div>
          <Badge variant="outline" className="text-green-500 border-green-500">
            GPS-Denied Mode
          </Badge>
        </div>
      </div>

      {/* Video Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Video Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted" />
            <div className="relative z-10 text-center space-y-2">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Camera Feed</p>
              <p className="text-xs text-muted-foreground">1920x1080 @ 30fps</p>
            </div>
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 text-xs font-mono space-y-1">
                <div className="bg-black/50 px-2 py-1 rounded">ALT: {telemetry.altitude.toFixed(1)}m</div>
                <div className="bg-black/50 px-2 py-1 rounded">SPD: {telemetry.speed.toFixed(1)}m/s</div>
                <div className="bg-black/50 px-2 py-1 rounded">HDG: {telemetry.heading.toFixed(0)}°</div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="h-8 w-8 border-2 border-primary rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation2 className="h-4 w-4 text-primary" />
              Altitude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{telemetry.altitude.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">meters AGL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{telemetry.speed.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">m/s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Battery className="h-4 w-4 text-primary" />
              Battery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{telemetry.battery}%</div>
            <Progress value={telemetry.battery} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Signal className="h-4 w-4 text-primary" />
              Signal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{telemetry.signal}%</div>
            <Progress value={telemetry.signal} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Altitude History</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                altitude: {
                  label: "Altitude",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[200px]"
            >
              <AreaChart data={altitudeData}>
                <defs>
                  <linearGradient id="fillAltitude" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#fillAltitude)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Speed History</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                speed: {
                  label: "Speed",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[200px]"
            >
              <AreaChart data={speedData}>
                <defs>
                  <linearGradient id="fillSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-speed)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-speed)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="var(--color-speed)"
                  fill="url(#fillSpeed)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Wind Speed</span>
              </div>
              <div className="text-lg font-semibold">3.2 m/s</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Temperature</span>
              </div>
              <div className="text-lg font-semibold">{telemetry.temperature}°C</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Navigation2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Heading</span>
              </div>
              <div className="text-lg font-semibold">{telemetry.heading.toFixed(0)}°</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Warnings</span>
              </div>
              <div className="text-lg font-semibold text-green-500">None</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
