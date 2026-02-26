"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Telemetry } from "@/lib/telemetry"
import { MissionProgress } from "@/components/mission-progress"

interface TacticalViewProps {
    telemetry: Telemetry
    mapElement: React.ReactNode
    mapMode: "2D" | "3D"
    onToggleMapMode: () => void
    className?: string
}

export function TacticalView({ telemetry, mapElement, mapMode, onToggleMapMode }: TacticalViewProps) {
    return (
        <div className="flex flex-col gap-3 h-full min-h-0">

            {/* Compact metric strip — 4 cells in a single row */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
                <MetricBox label="ALT" value={telemetry.altitude.toFixed(1)} unit="M" />
                <MetricBox label="SPD" value={telemetry.speed.toFixed(1)} unit="M/S" />
                <MetricBox label="DIST" value={telemetry.distance.toFixed(0)} unit="M" />
                <MetricBox
                    label="SATS"
                    value={String(telemetry.gpsSatellites)}
                    unit="SAT"
                    color={telemetry.gpsSatellites > 6 ? "text-emerald-500" : "text-orange-500"}
                />
            </div>

            {/* Map — takes all remaining vertical space */}
            <Card className="flex-1 relative bg-background/60 dark:bg-background/40 backdrop-blur-xl border-border/40 overflow-hidden rounded-xl min-h-0">
                {/* Map mode toggle */}
                <div className="absolute top-2 right-2 z-20 flex border border-border/60 rounded overflow-hidden shadow-lg">
                    <Button
                        variant={mapMode === "2D" ? "default" : "ghost"}
                        size="sm"
                        className="h-5 px-3 text-[8px] rounded-none uppercase font-black"
                        onClick={onToggleMapMode}
                    >2D</Button>
                    <Button
                        variant={mapMode === "3D" ? "default" : "ghost"}
                        size="sm"
                        className="h-5 px-3 text-[8px] rounded-none uppercase font-black"
                        onClick={onToggleMapMode}
                    >3D</Button>
                </div>

                {/* Map fills the card */}
                <div className="absolute inset-0 grayscale contrast-125 brightness-100 dark:brightness-75 transition-all">
                    {mapElement}
                </div>

                {/* Heading overlay — bottom-left corner */}
                <div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 font-mono">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] block leading-none mb-0.5">Heading</span>
                    <span className="text-base font-black text-emerald-400 leading-none">{telemetry.heading.toFixed(0)}°</span>
                </div>

                {/* Battery overlay — bottom-right corner */}
                <div className="absolute bottom-2 right-2 z-20 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 font-mono">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] block leading-none mb-0.5">Battery</span>
                    <span className={`text-base font-black leading-none ${telemetry.battery < 20 ? "text-red-400 animate-pulse" : telemetry.battery < 40 ? "text-orange-400" : "text-emerald-400"}`}>
                        {telemetry.battery.toFixed(0)}%
                    </span>
                </div>
            </Card>

            {/* Mission progress — only rendered when there is an active mission */}
            <MissionProgress />

        </div>
    )
}

function MetricBox({
    label,
    value,
    unit,
    color = "text-emerald-500",
}: {
    label: string
    value: string
    unit: string
    color?: string
}) {
    return (
        <Card className="bg-black/5 dark:bg-black/20 p-3 flex flex-col items-center justify-center text-center border-white/5 rounded-xl group hover:border-white/10 transition-colors">
            <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.25em] mb-1 leading-none">{label}</span>
            <div className={`text-2xl font-black font-mono tracking-tighter ${color} tabular-nums leading-none mb-1`}>{value}</div>
            <span className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none">{unit}</span>
        </Card>
    )
}
