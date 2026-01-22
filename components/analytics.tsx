"use client"

import { TrendingUp, Clock, MapPin, Battery } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"

const flightData = [
  { date: "Jan 8", flights: 3, duration: 45 },
  { date: "Jan 9", flights: 5, duration: 68 },
  { date: "Jan 10", flights: 4, duration: 52 },
  { date: "Jan 11", flights: 6, duration: 78 },
  { date: "Jan 12", flights: 7, duration: 92 },
  { date: "Jan 13", flights: 4, duration: 58 },
  { date: "Jan 14", flights: 5, duration: 65 },
]

const batteryData = [
  { flight: "F1", consumption: 85 },
  { flight: "F2", consumption: 78 },
  { flight: "F3", consumption: 92 },
  { flight: "F4", consumption: 88 },
  { flight: "F5", consumption: 75 },
  { flight: "F6", consumption: 90 },
]

const recentFlights = [
  {
    id: "1",
    mission: "Survey Mission 01",
    date: "2025-01-12",
    duration: "8:32",
    distance: "2.4 km",
    status: "completed",
  },
  {
    id: "2",
    mission: "Perimeter Inspection",
    date: "2025-01-11",
    duration: "6:15",
    distance: "1.8 km",
    status: "completed",
  },
  {
    id: "3",
    mission: "Warehouse Inventory",
    date: "2025-01-10",
    duration: "12:08",
    distance: "0.8 km",
    status: "completed",
  },
  {
    id: "4",
    mission: "Pipeline Monitoring",
    date: "2025-01-10",
    duration: "28:45",
    distance: "8.2 km",
    status: "completed",
  },
]

export function Analytics() {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-shrink-0 p-6 pb-4 border-b border-white/5">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Flight statistics and performance metrics</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Total Flights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">34</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500">+12%</span> from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Flight Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">458</div>
                <p className="text-xs text-muted-foreground mt-1">minutes total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">48.2</div>
                <p className="text-xs text-muted-foreground mt-1">kilometers covered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Battery className="h-4 w-4 text-primary" />
                  Avg Battery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">84%</div>
                <p className="text-xs text-muted-foreground mt-1">consumption per flight</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Flight Activity</CardTitle>
                <CardDescription>Number of flights per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    flights: {
                      label: "Flights",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <BarChart data={flightData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="flights" fill="var(--color-flights)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flight Duration</CardTitle>
                <CardDescription>Total flight time per day (minutes)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    duration: {
                      label: "Duration",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <LineChart data={flightData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="duration" stroke="var(--color-duration)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Battery Consumption</CardTitle>
              <CardDescription>Battery usage per flight</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  consumption: {
                    label: "Consumption",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[200px]"
              >
                <BarChart data={batteryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="flight" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="consumption" fill="var(--color-consumption)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Flights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Flights</CardTitle>
              <CardDescription>Latest completed missions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentFlights.map((flight) => (
                  <div key={flight.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{flight.mission}</div>
                      <div className="text-sm text-muted-foreground">{flight.date}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-mono">{flight.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Distance</div>
                        <div className="font-mono">{flight.distance}</div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {flight.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
