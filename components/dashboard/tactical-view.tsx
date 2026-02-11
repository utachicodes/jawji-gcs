"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Telemetry } from "@/lib/telemetry"
import { Compass } from "lucide-react"
import { MissionProgress } from "@/components/mission-progress"

interface TacticalViewProps {
    telemetry: Telemetry
    mapElement: React.ReactNode
    mapMode: "2D" | "3D"
    onToggleMapMode: () => void
}

export function TacticalView({ telemetry, mapElement, mapMode, onToggleMapMode }: TacticalViewProps) {
    return (
        <div className="h-full flex flex-col gap-4 min-h-0">
            {/* Map Section */}
            <Card className="flex-[1.5] relative bg-background/40 backdrop-blur-xl border-border/40 overflow-hidden glass-panel">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <h2 className="text-xs font-black tracking-widest text-white/70 uppercase">Tactical View</h2>
                </div>
                <div className="absolute top-4 right-4 z-10 flex border border-border/40 rounded overflow-hidden">
                    <Button
                        variant={mapMode === "2D" ? "default" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-[8px] rounded-none uppercase font-bold"
                        onClick={onToggleMapMode}
                    >2D</Button>
                    <Button
                        variant={mapMode === "3D" ? "default" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-[8px] rounded-none uppercase font-bold"
                        onClick={onToggleMapMode}
                    >3D</Button>
                </div>

                <div className="h-full w-full grayscale contrast-125 brightness-75">
                    {mapElement}
                </div>
            </Card>

            {/* Metrics Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Heading Rose */}
                <Card className="col-span-2 glass-panel p-4 flex flex-col items-center justify-center relative min-h-[140px]">
                    <span className="absolute top-2 left-2 text-[8px] font-bold text-muted-foreground uppercase">Heading</span>
                    <div className="relative h-24 w-24 border-2 border-border/40 rounded-full">
                        {/* Simplified N-S-E-W */}
                        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold">N</span>
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-50">S</span>
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-50">E</span>
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-50">W</span>
                        {/* Needle */}
                        <div
                            className="absolute inset-0 transition-transform duration-300"
                            style={{ transform: `rotate(${telemetry.heading}deg)` }}
                        >
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-primary shadow-[0_5px_15px_rgba(var(--primary-rgb),0.5)]" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-black font-mono tracking-tighter italic">
                        {telemetry.heading.toFixed(0)}°
                    </div>
                </Card>

                {/* Grid Stats */}
                <MetricBox label="Altitude" value={telemetry.altitude.toFixed(1)} unit="Meters" />
                <MetricBox label="Speed" value={telemetry.speed.toFixed(1)} unit="M/S" />
                <MetricBox label="Distance" value={Math.round(telemetry.distance)} unit="M" />
                <MetricBox label="Satellites" value={telemetry.gpsSatellites} unit="SATS" color={telemetry.gpsSatellites < 6 ? "text-red-500" : "text-primary"} />
            </div>

            {/* Mission Progress Card */}
            <Card className="glass-panel p-4 flex flex-col min-h-0 min-h-[120px] overflow-hidden">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Mission Protocol</span>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <MissionProgress />
                </div>
            </Card>
        </div>
    )
}

function MetricBox({ label, value, unit, color = "text-primary" }: { label: string, value: string | number, unit: string, color?: string }) {
    return (
        <Card className="glass-panel p-3 flex flex-col items-center justify-center text-center overflow-hidden">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{label}</span>
            <div className={`text-2xl font-black font-mono tracking-tighter ${color} leading-none mb-1`}>{value}</div>
            <span className="text-[8px] font-bold text-muted-foreground uppercase">{unit}</span>
            <div className="w-full h-0.5 bg-muted/20 mt-2 relative overflow-hidden">
                <div className={`absolute inset-0 bg-current transition-all duration-1000 ${color}`} style={{ width: '40%' }} />
            </div>
        </Card>
    )
}
