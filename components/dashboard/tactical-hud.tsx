"use client"

import { useEffect, useState } from "react"
import type { Telemetry } from "@/lib/telemetry"
import { AlertTriangle } from "lucide-react"

interface TacticalHUDProps {
    telemetry: Telemetry
    children?: React.ReactNode
}

export function TacticalHUD({ telemetry, children }: TacticalHUDProps) {
    const isCriticalBattery = telemetry.battery < 20

    return (
        <div className="relative h-full w-full bg-black overflow-hidden rounded-xl border border-border/40 font-mono">
            {/* Underlying Video/Content */}
            <div className="absolute inset-0 z-0 opacity-80">
                {children}
            </div>

            {/* HUD Layers */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col p-6">

                {/* Top: Mode and GPS and Compass Tape */}
                <div className="flex justify-between items-start w-full">
                    <div className="bg-emerald-500/90 text-black px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        {telemetry.flightMode}
                    </div>

                    {/* Heading Tape / Compass Ribbon */}
                    <div className="flex-1 flex flex-col items-center px-20">
                        <div className="relative w-full h-8 overflow-hidden bg-black/40 border-b border-white/20">
                            <div
                                className="absolute top-0 flex items-center transition-transform duration-100 ease-linear"
                                style={{ transform: `translateX(calc(50% - ${telemetry.heading * 2}px))` }}
                            >
                                {[...Array(37)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center w-[20px] shrink-0">
                                        <div className={`h-2 border-l ${i % 3 === 0 ? "h-3 border-white/60" : "border-white/30"}`} />
                                        {i % 4 === 0 && (
                                            <span className="text-[10px] mt-1 font-bold text-white/80">
                                                {i === 36 ? 0 : i * 10}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Center Indicator */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col items-center">
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary" />
                            </div>
                        </div>
                    </div>

                    <div className={`text-xs font-bold px-3 py-1 rounded border ${telemetry.gpsSatellites > 6 ? "border-emerald-500/50 text-emerald-400" : "border-red-500/50 text-red-500"}`}>
                        GPS: {telemetry.gpsSatellites > 0 ? telemetry.gpsSatellites : "NO LOCK"}
                    </div>
                </div>

                {/* Center: Flight Dynamics and Warnings */}
                <div className="flex-1 flex items-center justify-between min-h-0">

                    {/* Speed Ladder (Left) */}
                    <div className="flex flex-col items-center h-[60%] justify-center relative bg-black/20 px-2 border-r border-white/10">
                        <span className="text-[10px] text-muted-foreground font-bold absolute -top-6">SPD</span>
                        <div className="flex flex-col gap-8 items-end w-12">
                            {[25, 20, 15, 10, 5, 0].map(v => (
                                <div key={v} className="flex items-center gap-2">
                                    <span className={`text-[10px] ${Math.abs(telemetry.speed - v) < 2.5 ? "text-primary font-bold" : "text-white/40"}`}>{v}</span>
                                    <div className="w-2 h-px bg-white/20" />
                                </div>
                            ))}
                        </div>
                        {/* Current Value Indicator */}
                        <div className="absolute left-full ml-1 px-2 py-1 bg-primary text-black font-bold text-sm rounded shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
                            {telemetry.speed.toFixed(1)}
                        </div>
                        <span className="text-[10px] text-muted-foreground absolute -bottom-6">M/S</span>
                    </div>

                    {/* Critical Overlay */}
                    {isCriticalBattery && (
                        <div className="bg-red-600/90 text-white p-8 rounded-2xl flex flex-col items-center gap-4 border-2 border-white/20 animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                            <AlertTriangle className="h-16 w-16" />
                            <div className="text-center">
                                <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Critical Battery</h1>
                                <p className="text-sm font-bold opacity-80 mt-1 uppercase">Initiate RTH Immediately</p>
                            </div>
                            <div className="grid grid-cols-3 gap-8 w-full border-t border-white/20 mt-4 pt-4 tracking-tighter uppercase font-bold text-[10px]">
                                <div className="text-center">
                                    <div className="text-muted-foreground">Remaining</div>
                                    <div className="text-lg">{telemetry.battery.toFixed(0)}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-muted-foreground">Est. Time</div>
                                    <div className="text-lg">~3 MIN</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-muted-foreground">Dist Home</div>
                                    <div className="text-lg">{telemetry.distance.toFixed(0)}M</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Altitude Ladder (Right) */}
                    <div className="flex flex-col items-center h-[60%] justify-center relative bg-black/20 px-2 border-l border-white/10">
                        <span className="text-[10px] text-muted-foreground font-bold absolute -top-6">ALT</span>
                        <div className="flex flex-col gap-8 items-start w-12">
                            {[150, 130, 110, 90, 70, 50].map(v => (
                                <div key={v} className="flex items-center gap-2">
                                    <div className="w-2 h-px bg-white/20" />
                                    <span className={`text-[10px] ${Math.abs(telemetry.altitude - v) < 10 ? "text-primary font-bold" : "text-white/40"}`}>{v}</span>
                                </div>
                            ))}
                        </div>
                        {/* Current Value Indicator */}
                        <div className="absolute right-full mr-1 px-2 py-1 bg-primary text-black font-bold text-sm rounded shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
                            {telemetry.altitude.toFixed(1)}
                        </div>
                        <span className="text-[10px] text-muted-foreground absolute -bottom-6">Meters</span>
                    </div>

                </div>

                {/* Bottom HUD info */}
                <div className="flex justify-center items-end w-full gap-12 text-[10px] font-bold text-white/70 tracking-widest uppercase mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-primary">HOG</span> {telemetry.heading.toFixed(0)}°
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-primary">VS</span> {telemetry.verticalSpeed > 0 ? "+" : ""}{telemetry.verticalSpeed.toFixed(1)} m/s
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-primary">DIST</span> {telemetry.distance.toFixed(0)}m
                    </div>
                </div>

            </div>
        </div>
    )
}
