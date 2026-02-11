"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { Telemetry } from "@/lib/telemetry"
import { Zap, Navigation2, Wind, Activity } from "lucide-react"
import { TelemetryCharts } from "@/components/telemetry-charts"

interface SystemDiagnosticsProps {
    telemetry: Telemetry
}

export function SystemDiagnostics({ telemetry }: SystemDiagnosticsProps) {
    return (
        <Card className="h-full bg-background/40 backdrop-blur-xl border-border/40 flex flex-col overflow-hidden glass-panel">
            <div className="p-4 border-b border-border/40">
                <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">System Diagnostics</h2>
            </div>

            <Tabs defaultValue="data" className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 bg-muted/20">
                    <TabsList className="grid grid-cols-3 bg-background/50 border border-border/40">
                        <TabsTrigger value="data" className="text-[10px] uppercase font-bold tracking-tighter">Data</TabsTrigger>
                        <TabsTrigger value="health" className="text-[10px] uppercase font-bold tracking-tighter">Health</TabsTrigger>
                        <TabsTrigger value="charts" className="text-[10px] uppercase font-bold tracking-tighter">Charts</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="data" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">
                    {/* Power System */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Zap className="h-3 w-3 text-primary" />
                            Power System
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-muted-foreground">Battery</span>
                                <span className={`text-sm font-mono font-bold ${telemetry.battery < 20 ? "text-red-500" : "text-primary"}`}>
                                    {telemetry.battery.toFixed(0)}%
                                </span>
                            </div>
                            <Progress value={telemetry.battery} className="h-1 bg-muted/30" color={telemetry.battery < 20 ? "rgb(239 68 68)" : "rgb(var(--primary))"} />
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-muted-foreground">Voltage</span>
                                    <span className="font-mono text-emerald-400 font-bold">{telemetry.voltage.toFixed(2)}V</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-muted-foreground">Current</span>
                                    <span className="font-mono text-emerald-400 font-bold">{telemetry.current.toFixed(1)}A</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Navigation */}
                    <section className="space-y-3 pt-2 border-t border-border/20">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Navigation2 className="h-3 w-3 text-primary" />
                            Navigation
                        </div>
                        <div className="space-y-2 font-mono text-[10px]">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Latitude</span>
                                <span className="text-emerald-400 font-bold">{telemetry.latitude.toFixed(6)}°</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Longitude</span>
                                <span className="text-emerald-400 font-bold">{telemetry.longitude.toFixed(6)}°</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">HDOP</span>
                                <span className="text-emerald-400 font-bold">{telemetry.hdop.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Environment */}
                    <section className="space-y-3 pt-2 border-t border-border/20">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Wind className="h-3 w-3 text-primary" />
                            Environment
                        </div>
                        <div className="grid grid-cols-1 gap-2 font-mono text-[10px]">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Temperature</span>
                                <span className="text-emerald-400 font-bold">{telemetry.temperature.toFixed(1)}°C</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Humidity</span>
                                <span className="text-emerald-400 font-bold">{telemetry.humidity.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Wind Speed</span>
                                <span className="text-emerald-400 font-bold">{telemetry.windSpeed.toFixed(1)} m/s</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Wind Dir</span>
                                <span className="text-emerald-400 font-bold">{telemetry.windDir.toFixed(0)}°</span>
                            </div>
                        </div>
                    </section>

                    {/* Motor Status */}
                    <section className="space-y-3 pt-2 border-t border-border/20">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Activity className="h-3 w-3 text-primary" />
                            Motor Status
                        </div>
                        <div className="grid grid-cols-4 gap-2 h-16 items-end">
                            {Object.entries(telemetry.motors).map(([key, val]) => (
                                <div key={key} className="flex flex-col gap-1 items-center h-full justify-end">
                                    <div className="w-full bg-muted/30 rounded-t overflow-hidden flex-1 flex flex-col justify-end">
                                        <div
                                            className="w-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                            style={{ height: `${val}%` }}
                                        />
                                    </div>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{key}</span>
                                    <span className="text-[8px] font-mono text-emerald-400">{val}%</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="health" className="flex-1 p-4 m-0">
                    <div className="text-xs text-muted-foreground italic">System health monitoring online...</div>
                </TabsContent>

                <TabsContent value="charts" className="flex-1 p-2 m-0 overflow-y-auto">
                    <div className="h-full">
                        <TelemetryCharts
                            altitude={telemetry.altitude}
                            speed={telemetry.speed}
                            battery={telemetry.battery}
                            verticalSpeed={telemetry.verticalSpeed}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    )
}
