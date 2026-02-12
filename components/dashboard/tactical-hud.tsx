"use client"

import { useEffect, useState } from "react"
import type { Telemetry } from "@/lib/telemetry"
import { AlertTriangle, Navigation, Wind, Target, Zap } from "lucide-react"

interface TacticalHUDProps {
    telemetry: Telemetry
    children?: React.ReactNode
}

export function TacticalHUD({ telemetry, children }: TacticalHUDProps) {
    const isCriticalBattery = telemetry.battery < 20

    return (
        <div className="relative h-full w-full bg-black/40 overflow-hidden rounded-xl border border-white/5 font-mono shadow-2xl backdrop-blur-[2px]">
            {/* Underlying Video/Content */}
            <div className="absolute inset-0 z-0 opacity-80">
                {children}
            </div>

            {/* HUD Layers */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col p-6">

                {/* Top: Mode and GPS and Compass Tape */}
                <div className="flex justify-between items-start w-full relative">
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Mode</span>
                        <div className="bg-emerald-500 text-black px-4 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-white/20">
                            {telemetry.flightMode}
                        </div>
                    </div>

                    {/* Heading Tape / Compass Ribbon */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center w-[300px]">
                        <div className="relative w-full h-8 overflow-hidden bg-black/40 border border-white/5 rounded-full backdrop-blur-md">
                            <div
                                className="absolute top-0 flex items-center transition-transform duration-100 ease-linear h-full"
                                style={{ transform: `translateX(calc(50% - ${telemetry.heading * 4}px))` }}
                            >
                                {[...Array(73)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center w-[40px] shrink-0">
                                        <div className={`h-1.5 border-l ${i % 2 === 0 ? "h-3 border-white/60" : "h-1.5 border-white/20"}`} />
                                        {i % 3 === 0 && (
                                            <span className="text-[8px] mt-0.5 font-bold text-white/50 tracking-tighter">
                                                {((i * 5) % 360)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Center Indicator */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col items-center justify-between pb-1">
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-emerald-500 shadow-[0_4px_10px_rgba(16,185,129,0.5)]" />
                                <div className="w-[1px] h-full bg-emerald-500/30" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mr-1">Power</span>
                            <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-sm border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-black text-white/40 uppercase">TTE</span>
                                    <span className={`text-[10px] font-black ${telemetry.timeToEmpty < 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                                        {telemetry.timeToEmpty.toFixed(0)}m
                                    </span>
                                </div>
                                <div className="w-px h-3 bg-white/10" />
                                <div className="flex items-center gap-1.5">
                                    <Zap className={`h-3 w-3 ${telemetry.battery < 20 ? 'text-red-500' : 'text-emerald-400'}`} />
                                    <span className={`text-[10px] font-black ${telemetry.battery < 20 ? 'text-red-500' : 'text-white'}`}>{telemetry.battery.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mr-1">GPS</span>
                            <div className={`text-[10px] font-black px-3 py-1 rounded-sm border backdrop-blur-sm ${telemetry.gpsSatellites > 6 ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-orange-500/10 border-orange-500/50 text-orange-500"}`}>
                                {telemetry.gpsSatellites > 6 ? "LOCK" : "NO LOCK"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Flight Dynamics and Warnings */}
                <div className="flex-1 flex items-center justify-between min-h-0">

                    {/* Speed Ladder (Left) */}
                    <div className="flex flex-col items-center h-[60%] justify-center relative px-2">
                        <div className="absolute left-0 h-full w-[2px] bg-white/5 flex flex-col justify-between py-2">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className={`w-2 h-px ${i % 2 === 0 ? "bg-white/40 w-3" : "bg-white/10"}`} />
                            ))}
                        </div>
                        <div className="flex flex-col gap-8 items-end pr-6">
                            {[25, 20, 15, 10, 5, 0].map(v => (
                                <span key={v} className={`text-[10px] font-black tracking-tighter transition-all duration-300 ${Math.abs(telemetry.speed - v) <= 2.5 ? "text-emerald-400 scale-125 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-white/20"}`}>
                                    {v.toString().padStart(2, '0')}
                                </span>
                            ))}
                        </div>
                        {/* Current Value Indicator */}
                        <div className="absolute left-8 px-2 py-1 bg-emerald-500 text-black font-black text-[11px] rounded-[2px] shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/20">
                            {telemetry.speed.toFixed(1)}
                        </div>
                        <span className="text-[7px] font-black text-white/30 absolute -bottom-8 tracking-[0.2em] whitespace-nowrap">VEL-MS</span>
                    </div>

                    {/* Critical Overlay */}
                    {isCriticalBattery && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
                            <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[2px]" />
                            <div className="relative group">
                                <div className="absolute inset-0 bg-red-600/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                                <div className="relative bg-black/80 backdrop-blur-xl text-white p-10 rounded-2xl border-4 border-red-600/50 flex flex-col items-center gap-8 shadow-[0_0_100px_rgba(220,38,38,0.3)] min-w-[400px]">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse">
                                            <AlertTriangle className="h-10 w-10 text-white" strokeWidth={3} />
                                        </div>
                                        <div className="text-center">
                                            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-red-500">Critical Battery</h1>
                                            <div className="h-0.5 w-full bg-red-500/30 mt-4 mb-2" />
                                            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/60">Initiate Landing Sequence</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-8 w-full tracking-tighter uppercase font-black text-center border-t border-white/10 pt-8">
                                        <div className="flex flex-col">
                                            <div className="text-[9px] text-white/40 mb-1">Charge</div>
                                            <div className="text-3xl text-red-500">{telemetry.battery.toFixed(0)}%</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-[9px] text-white/40 mb-1">Time</div>
                                            <div className="text-3xl">~{telemetry.timeToEmpty.toFixed(0)}<span className="text-sm">MIN</span></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-[9px] text-white/40 mb-1">Return</div>
                                            <div className="text-3xl text-emerald-500">AUTO</div>
                                        </div>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-red-600 animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Altitude Ladder (Right) */}
                    <div className="flex flex-col items-center h-[60%] justify-center relative px-2">
                        <div className="absolute right-0 h-full w-[2px] bg-white/5 flex flex-col justify-between py-2">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className={`w-2 h-px ${i % 2 === 0 ? "bg-white/40 w-3" : "bg-white/10"}`} />
                            ))}
                        </div>
                        <div className="flex flex-col gap-8 items-start pl-6">
                            {[120, 100, 80, 60, 40, 20, 0].map(v => (
                                <span key={v} className={`text-[10px] font-black tracking-tighter transition-all duration-300 ${Math.abs(telemetry.altitude - v) <= 10 ? "text-emerald-400 scale-125 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-white/20"}`}>
                                    {v.toString().padStart(3, '0')}
                                </span>
                            ))}
                        </div>
                        {/* Current Value Indicator */}
                        <div className="absolute right-8 px-2 py-1 bg-emerald-500 text-black font-black text-[11px] rounded-[2px] shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/20">
                            {telemetry.altitude.toFixed(1)}
                        </div>
                        <span className="text-[7px] font-black text-white/30 absolute -bottom-8 tracking-[0.2em] whitespace-nowrap">ALT-MTR</span>
                    </div>

                </div>

                {/* Bottom HUD info */}
                <div className="flex justify-center items-end w-full gap-8 text-[10px] font-black text-white/90 tracking-widest uppercase mb-1">
                    <div className="flex items-center gap-2">
                        <Navigation className="h-3 w-3 text-white/40" />
                        <span>HOG {telemetry.heading.toFixed(0)}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wind className="h-3 w-3 text-white/40" />
                        <span>VS {telemetry.verticalSpeed > 0 ? "+" : ""}{telemetry.verticalSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-white/40" />
                        <span>DIST {telemetry.distance.toFixed(0)}m</span>
                    </div>
                </div>

            </div>
        </div>
    )
}
