"use client"

import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, BarChart3, ArrowUpRight, Calendar, Map, Timer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const FLITE_DATA = [
  { name: 'Mon', duration: 45, distance: 1250, flights: 3 },
  { name: 'Tue', duration: 60, distance: 1520, flights: 4 },
  { name: 'Wed', duration: 30, distance: 840, flights: 2 },
  { name: 'Thu', duration: 90, distance: 2210, flights: 6 },
  { name: 'Fri', duration: 45, distance: 1120, flights: 3 },
  { name: 'Sat', duration: 120, distance: 3550, flights: 8 },
  { name: 'Sun', duration: 75, distance: 1890, flights: 5 },
]

const LOGS = [
  { id: 1, date: "2024-01-16T10:30:00", drone: "X1-Alpha", duration: "14m 20s", distance: "2.5km", status: "completed" },
  { id: 2, date: "2024-01-16T09:15:00", drone: "X1-Beta", duration: "08m 45s", distance: "1.2km", status: "aborted" },
  { id: 3, date: "2024-01-15T16:45:00", drone: "X1-Alpha", duration: "22m 10s", distance: "4.8km", status: "completed" },
  { id: 4, date: "2024-01-15T14:20:00", drone: "S2-Recon", duration: "18m 30s", distance: "3.1km", status: "completed" },
  { id: 5, date: "2024-01-14T11:00:00", drone: "X1-Beta", duration: "12m 00s", distance: "1.9km", status: "completed" },
]

export default function AnalyticsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full overflow-hidden flex flex-col">
          <div className="flex-shrink-0 p-6 lg:p-10 pb-6 border-b border-white/5">
            <h1 className="text-3xl font-bold tracking-tight font-mono">FLIGHT ANALYTICS</h1>
            <p className="text-muted-foreground font-mono text-sm">Performance metrics and mission history</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 lg:p-10 space-y-8 pb-20">

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/40 backdrop-blur border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
                      <Timer className="h-4 w-4 text-blue-500" /> Total Flight Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-mono tracking-tight">24h 15m</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-mono">+12% vs last week</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
                      <Map className="h-4 w-4 text-emerald-500" /> Total Distance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-mono tracking-tight">412.5 km</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-mono">+5% vs last week</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-500" /> Missions Flown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-mono tracking-tight">31</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] font-mono">100% Success Rate</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                <Card className="border-primary/10 bg-card/50 backdrop-blur h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono uppercase">Flight Duration (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 pl-0 pb-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={FLITE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }} labelStyle={{ color: '#a1a1aa' }} />
                        <Area type="monotone" dataKey="duration" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDuration)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 bg-card/50 backdrop-blur h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono uppercase">Distance Covered (km)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 pl-0 pb-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={FLITE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }} labelStyle={{ color: '#a1a1aa' }} />
                        <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Logs Table */}
              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="pl-0">
                  <CardTitle className="font-mono text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> RECENT FLIGHT LOGS
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-0">
                  <ScrollArea className="h-[300px] border rounded-xl bg-card/50 backdrop-blur">
                    <div className="grid grid-cols-1 divide-y divide-border/50">
                      {LOGS.map(log => (
                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={`h-2 w-2 rounded-full ${log.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="font-mono font-bold text-sm flex items-center gap-2">
                                {log.drone}
                                <span className="text-muted-foreground font-normal">•</span>
                                <span className="text-muted-foreground font-normal">{new Date(log.date).toLocaleDateString()}</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                ID: LOG-{log.id.toString().padStart(4, '0')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm font-mono">
                            <div className="text-right">
                              <div className="text-muted-foreground text-[10px] uppercase">Duration</div>
                              <div>{log.duration}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-muted-foreground text-[10px] uppercase">Distance</div>
                              <div>{log.distance}</div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}

