"use client"

import type { Telemetry } from "@/lib/telemetry"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertCircle } from "lucide-react"

type StatusBadgeProps = { label: string; status: "READY" | "STABLE" | "NORMAL" | "WARN" | "ERROR" }

function StatusBadge({ label, status }: StatusBadgeProps) {
    const isGood = status === "READY" || status === "STABLE" || status === "NORMAL"
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{label}</span>
            <div className={`flex items-center gap-1 ${isGood ? "text-emerald-400" : "text-amber-400"}`}>
                {isGood
                    ? <CheckCircle2 className="h-3 w-3" />
                    : <AlertCircle className="h-3 w-3" />
                }
                <span className="text-[9px] font-black tracking-widest">{status}</span>
            </div>
        </div>
    )
}

/** 
 * Top-left floating card: System Health
 */
export function SystemHealthCard({ telemetry }: { telemetry: Telemetry }) {
    const gpsStatus = telemetry.gpsSatellites >= 6 ? "STABLE" : telemetry.gpsSatellites >= 3 ? "WARN" : "ERROR"
    const imuStatus = (Math.abs(telemetry.pitch) < 45 && Math.abs(telemetry.roll) < 45) ? "READY" : "WARN"
    const escStatus: "READY" | "STABLE" | "NORMAL" | "WARN" | "ERROR" =
        Math.max(telemetry.motors.m1, telemetry.motors.m2, telemetry.motors.m3, telemetry.motors.m4) > 0
            ? "NORMAL"
            : "READY"

    return (
        <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-[1.25rem] p-3 w-48 shadow-2xl pointer-events-auto">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">System Health</span>
            </div>
            <div className="text-[7px] font-bold text-emerald-400/80 uppercase tracking-widest mb-2 -mt-1">All Systems Nominal</div>
            <StatusBadge label="IMU" status={imuStatus} />
            <StatusBadge label="Compass" status={gpsStatus === "STABLE" ? "STABLE" : "WARN"} />
            <StatusBadge label="ESC" status={escStatus} />
        </div>
    )
}

/**
 * Top-left floating card: Power System
 */
export function PowerSystemCard({ telemetry }: { telemetry: Telemetry }) {
    const avgMotorLoad = Math.round(
        (telemetry.motors.m1 + telemetry.motors.m2 + telemetry.motors.m3 + telemetry.motors.m4) / 4
    )
    return (
        <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-[1.25rem] p-3 w-48 shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Power System</span>
            </div>
            <div className="space-y-3">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">TEMP</span>
                        <span className="text-[9px] font-black font-mono text-white/80">{telemetry.temperature.toFixed(0)}°C</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (telemetry.temperature / 80) * 100)}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Motor Load</span>
                        <span className="text-[9px] font-black font-mono text-white/80">{avgMotorLoad}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-500 shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                            style={{ width: `${avgMotorLoad}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
