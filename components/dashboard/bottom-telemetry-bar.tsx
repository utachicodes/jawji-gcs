"use client"

import type { Telemetry } from "@/lib/telemetry"
import { Mountain, Ruler, ArrowUpDown, Gauge, Navigation } from "lucide-react"

type MetricProps = {
    icon: React.ReactNode
    label: string
    value: string
    unit: string
    highlight?: boolean
}

function Metric({ icon, label, value, unit, highlight }: MetricProps) {
    return (
        <div className="flex flex-col items-center gap-0.5 px-5 border-r border-white/10 last:border-0">
            <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-white/40">{icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black font-mono tracking-tighter leading-none tabular-nums ${highlight ? "text-emerald-400" : "text-white"}`}>
                    {value}
                </span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{unit}</span>
            </div>
        </div>
    )
}

export function BottomTelemetryBar({ telemetry }: { telemetry: Telemetry }) {
    const avgMotorLoad = Math.round((telemetry.motors.m1 + telemetry.motors.m2 + telemetry.motors.m3 + telemetry.motors.m4) / 4)

    return (
        <div className="pointer-events-auto">
            <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-3 flex items-center gap-0 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                {/* Telemetry Metrics */}
                <div className="flex items-center flex-1 divide-x divide-white/5">
                    <Metric
                        icon={<Mountain className="h-3 w-3 stroke-[2.5]" />}
                        label="ALT"
                        value={telemetry.altitude.toFixed(1)}
                        unit="m"
                    />
                    <Metric
                        icon={<Ruler className="h-3 w-3 stroke-[2.5]" />}
                        label="DIST"
                        value={telemetry.distance.toFixed(1)}
                        unit="m"
                    />
                    <Metric
                        icon={<ArrowUpDown className="h-3 w-3 stroke-[2.5]" />}
                        label="V.S"
                        value={telemetry.verticalSpeed.toFixed(1)}
                        unit="m/s"
                        highlight={Math.abs(telemetry.verticalSpeed) > 0.5}
                    />
                    <Metric
                        icon={<Gauge className="h-3 w-3 stroke-[2.5]" />}
                        label="G.S"
                        value={telemetry.speed.toFixed(1)}
                        unit="m/s"
                    />
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 pl-4">
                    <button className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-white/60 hover:text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95">
                        <Navigation className="h-3 w-3" />
                        RTH
                    </button>
                    <button className="flex items-center gap-2 bg-[hsl(var(--primary))] hover:brightness-110 text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.4)] transition-all hover:scale-[1.02] active:scale-95">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 2L12 22M12 2L6 8M12 2L18 8" />
                        </svg>
                        TAKE OFF
                    </button>
                </div>
            </div>
        </div>
    )
}
