"use client"

import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { Telemetry } from "@/lib/telemetry"
import { Zap, Navigation, Wind, Activity, Thermometer } from "lucide-react"
import { TelemetryCharts } from "@/components/telemetry-charts"
import { WindVector } from "./wind-vector"

function MetricRow({ label, value, color = "text-primary" }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors px-1">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
            <span className={`text-[10px] font-black font-mono tracking-tight ${color}`}>{value}</span>
        </div>
    )
}

function DiagSection({ icon, value, unit, status, color = "text-primary" }: { icon: ReactNode, value: string, unit: string, status: string, color?: string }) {
    return (
        <div className="bg-background/20 p-4 rounded-xl border border-border/20 flex flex-col gap-3 group hover:border-border/40 transition-all">
            <div className="flex items-center justify-between">
                <div className="p-2 bg-muted/20 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[6px] font-black tracking-[0.3em] text-muted-foreground/60 uppercase mb-0.5">Status</span>
                    <span className="text-[8px] font-black tracking-widest text-primary uppercase">{status}</span>
                </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black tracking-tighter italic leading-none">{value}</span>
                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{unit}</span>
            </div>
        </div>
    )
}

export function SystemDiagnostics({ telemetry }: { telemetry: Telemetry }) {
    return (
        <Card className="h-full flex flex-col bg-background/60 dark:bg-background/40 backdrop-blur-xl border-border/40 overflow-hidden glass-panel rounded-xl">


            <Tabs defaultValue="data" className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 bg-muted/30 dark:bg-muted/10">
                    <TabsList className="grid grid-cols-3 bg-background/80 dark:bg-background/20 border border-border/60">
                        <TabsTrigger value="data" className="text-[10px] uppercase font-bold tracking-tighter transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Data</TabsTrigger>
                        <TabsTrigger value="health" className="text-[10px] uppercase font-bold tracking-tighter transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Health</TabsTrigger>
                        <TabsTrigger value="charts" className="text-[10px] uppercase font-bold tracking-tighter transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Charts</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="data" className="flex-1 overflow-y-auto p-4 space-y-6 m-0 custom-scrollbar">
                    {/* Power System */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <Zap className="h-3 w-3 text-primary" />
                                Power System
                            </div>
                            <span className={`text-[10px] font-black font-mono ${telemetry.battery < 20 ? "text-destructive animate-pulse" : "text-primary"}`}>
                                {telemetry.battery.toFixed(0)}%
                            </span>
                        </div>
                        <div className="space-y-1">
                            <Progress value={telemetry.battery} className="h-1 bg-white/5" color={telemetry.battery < 20 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                            <div className="grid grid-cols-1 pt-2">
                                <MetricRow label="Time to Empty" value={`~${telemetry.timeToEmpty.toFixed(0)} MIN`} color={telemetry.timeToEmpty < 5 ? "text-destructive" : "text-primary"} />
                                <MetricRow label="Battery Voltage" value={`${telemetry.voltage.toFixed(2)}V`} />
                                <MetricRow label="Current Draw" value={`${telemetry.current.toFixed(1)}A`} />
                            </div>
                        </div>
                    </section>

                    {/* Navigation */}
                    <section className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                            <Navigation className="h-3 w-3 text-primary" />
                            Global Position
                        </div>
                        <div className="grid grid-cols-1">
                            <MetricRow label="Latitude" value={`${telemetry.latitude.toFixed(6)}°`} />
                            <MetricRow label="Longitude" value={`${telemetry.longitude.toFixed(6)}°`} />
                            <MetricRow label="GPS Accuracy (HDOP)" value={telemetry.hdop.toFixed(2)} color={telemetry.hdop < 2 ? "text-primary" : "text-amber-500"} />
                        </div>
                    </section>

                    <section className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <Wind className="h-3 w-3 text-primary" />
                                Atmospherics
                            </div>
                        </div>
                        <div className="flex justify-center py-2">
                            <WindVector speed={telemetry.windSpeed} direction={telemetry.windDir} />
                        </div>
                        <div className="grid grid-cols-1">
                            <MetricRow label="Air Temperature" value={`${telemetry.temperature.toFixed(1)}°C`} />
                            <MetricRow label="Relative Humidity" value={`${telemetry.humidity.toFixed(0)}%`} />
                        </div>
                    </section>

                    {/* Motor Status */}
                    <section className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <Activity className="h-3 w-3 text-primary" />
                                Motor Status
                            </div>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">M1-M4</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 h-32 items-end px-1">
                            {Object.entries(telemetry.motors).map(([key, val]) => (
                                <div key={key} className="flex flex-col gap-2 items-center h-full group">
                                    <div className="w-full bg-muted/20 rounded-sm overflow-hidden flex-1 flex flex-col justify-end border border-border/10 relative">
                                        {/* Inner Grid Pattern */}
                                        <div className="absolute inset-0 opacity-10"
                                            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '4px 4px' }}
                                        />
                                        <div
                                            className="w-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] transition-all duration-500 ease-out group-hover:brightness-110 relative z-10"
                                            style={{ height: `${val}%` }}
                                        >
                                            {/* Glow overlay */}
                                            <div className="absolute inset-x-0 top-0 h-px bg-white/40 shadow-[0_0_10px_white]" />
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">{key}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="health" className="flex-1 p-4 m-0">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <DiagSection
                            icon={<Zap className="h-5 w-5 text-amber-500" />}
                            value="24.2"
                            unit="V"
                            status="STABLE"
                        />
                        <DiagSection
                            icon={<Navigation className="h-5 w-5 text-blue-500" />}
                            value="12"
                            unit="SAT"
                            status="LOCK"
                        />
                        <DiagSection
                            icon={<Thermometer className="h-5 w-5 text-emerald-500" />}
                            value="42"
                            unit="°C"
                            status="NOMINAL"
                        />
                        <DiagSection
                            icon={<Activity className="h-5 w-5 text-primary" />}
                            value="850"
                            unit="RPM"
                            status="SYNC"
                        />
                    </div>
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
