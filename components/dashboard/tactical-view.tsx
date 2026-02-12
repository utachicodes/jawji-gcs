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
        <div className="flex gap-4 h-full min-h-0">
            {/* Map Section */}
            <Card className="flex-[1.8] relative bg-background/60 dark:bg-background/40 backdrop-blur-xl border-border/40 overflow-hidden glass-panel p-4 flex flex-col rounded-xl">
                <div className="flex items-center justify-end mb-2">
                    <div className="flex border border-border/40 rounded overflow-hidden">
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
                </div>

                <div className="flex-1 w-full grayscale contrast-125 brightness-100 dark:brightness-75 transition-all rounded-lg overflow-hidden border border-border/20">
                    {mapElement}
                </div>
            </Card>

            {/* Right Side Info */}
            <div className="flex-1 flex flex-col gap-4 min-h-0 max-w-[320px]">
                {/* Heading Dial */}
                <Card className="h-56 bg-black/5 dark:bg-black/20 border-border/20 p-6 flex flex-col items-center justify-center relative overflow-hidden rounded-xl">
                    <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/40 uppercase tracking-[0.5em] z-10">
                        Heading
                    </span>

                    <div className="relative h-40 w-40 flex items-center justify-center scale-110">
                        {/* Static Compass Ring */}
                        <div className="absolute inset-0 rounded-full border border-white/5 bg-black/10">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-white/5"
                                    style={{ transform: `rotate(${i * 15}deg)` }}
                                />
                            ))}
                        </div>

                        {/* Rotating Dial */}
                        <div
                            className="absolute inset-0 transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
                            style={{ transform: `rotate(${-telemetry.heading}deg)` }}
                        >
                            {/* Degree Markers */}
                            {[...Array(72)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1.5px] ${i % 18 === 0 ? "h-4 bg-emerald-500" : i % 3 === 0 ? "h-2.5 bg-white/40" : "h-1.5 bg-white/10"}`}
                                    style={{ transform: `rotate(${i * 5}deg)` }}
                                />
                            ))}
                            {/* Cardinal Labels */}
                            <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[12px] font-black text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ transform: 'rotate(0deg)' }}>N</span>
                            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/40" style={{ transform: 'rotate(180deg)' }}>S</span>
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40" style={{ transform: 'rotate(-90deg)' }}>E</span>
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40" style={{ transform: 'rotate(90deg)' }}>W</span>
                        </div>

                        {/* Fixed Pointer Indicator */}
                        <div className="relative z-30 flex flex-col items-center">
                            <div className="h-0 w-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] mb-3" />
                            <div className="text-4xl font-black font-mono tracking-tighter italic leading-none text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                {telemetry.heading.toFixed(0)}<span className="text-lg opacity-40 ml-1">°</span>
                            </div>
                        </div>

                        {/* Center Target Box */}
                        <div className="absolute inset-10 border border-white/5 rounded-sm pointer-events-none" />
                    </div>
                </Card>

                {/* 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <MetricBox label="Altitude" value={telemetry.altitude.toFixed(1)} unit="Meters" />
                    <MetricBox label="Speed" value={telemetry.speed.toFixed(1)} unit="M/S" />
                    <MetricBox label="Distance" value={telemetry.distance.toFixed(0)} unit="M" />
                    <MetricBox label="Satellites" value={telemetry.gpsSatellites} unit="Sats" color={telemetry.gpsSatellites > 6 ? "text-emerald-500" : "text-orange-500"} />
                </div>

                {/* Flight Sequence / Mission Progress */}
                <MissionProgress />
            </div>
        </div>
    )
}

function MetricBox({ label, value, unit, color = "text-emerald-500" }: { label: string, value: string | number, unit: string, color?: string }) {
    return (
        <Card className="bg-black/5 dark:bg-black/20 p-6 flex flex-col items-center justify-center text-center overflow-hidden border-white/5 rounded-xl group hover:border-white/10 transition-colors">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">{label}</span>
            <div className={`text-5xl font-black font-mono tracking-tighter ${color} tabular-nums leading-none mb-3 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]`}>{value}</div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{unit}</span>
            </div>
            <div className="w-full h-[2px] bg-white/5 mt-6 relative overflow-hidden rounded-full">
                <div
                    className={`absolute inset-0 transition-all duration-500 ${color}`}
                    style={{ width: '100%', opacity: 0.15 }}
                />
            </div>
        </Card>
    )
}
