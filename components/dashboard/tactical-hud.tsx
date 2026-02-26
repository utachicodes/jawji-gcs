"use client"

import type { ReactNode } from "react"
import type { Telemetry } from "@/lib/telemetry"
import { AlertTriangle } from "lucide-react"

interface TacticalHUDProps {
    telemetry: Telemetry
    children?: ReactNode
    connectionState?: "connected" | "warning" | "disconnected"
}

export function TacticalHUD({ telemetry, children, connectionState = "connected" }: TacticalHUDProps) {
    const isCriticalBattery = telemetry.battery < 20

    const statusStyles: Record<NonNullable<TacticalHUDProps["connectionState"]>, { label: string; cls: string }> = {
        connected: { label: "CONNECTED", cls: "bg-primary text-primary-foreground border-primary" },
        warning: { label: "WARNING", cls: "bg-amber-500 text-black border-amber-500" },
        disconnected: { label: "DISCONNECTED", cls: "bg-destructive text-destructive-foreground border-destructive" },
    }

    return (
        <div className="relative h-full w-full bg-black overflow-hidden rounded-xl border border-border/60 font-mono">
            {/* Underlying Video/Content */}
            <div className="absolute inset-0 z-0">
                {children}
            </div>

            {/* HUD Layers */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col p-3">

                {/* Top: status + mode */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`h-7 px-2.5 flex items-center border text-[11px] font-black tracking-widest ${statusStyles[connectionState].cls}`}>
                            {statusStyles[connectionState].label}
                        </div>
                        <div className="h-7 px-2.5 flex items-center border border-border/40 bg-background/60 text-foreground text-[11px] font-black tracking-widest">
                            {telemetry.flightMode}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <HudCell label="BAT" value={`${telemetry.battery.toFixed(0)}%`} state={telemetry.battery < 20 ? "red" : telemetry.battery < 40 ? "amber" : "neutral"} />
                        <HudCell label="SIG" value={`${telemetry.signal.toFixed(0)}%`} state={telemetry.signal < 20 ? "amber" : "neutral"} />
                    </div>
                </div>

                {/* Center reserved for video */}
                <div className="flex-1 min-h-0" />

                {/* Bottom: primary flight telemetry strip */}
                <div className="grid grid-cols-6 gap-2">
                    <HudCell label="ALT" value={`${telemetry.altitude.toFixed(1)}m`} />
                    <HudCell label="SPD" value={`${telemetry.speed.toFixed(1)}m/s`} />
                    <HudCell label="HDG" value={`${telemetry.heading.toFixed(0)}°`} />
                    <HudCell label="GPS" value={`${telemetry.gpsSatellites.toFixed(0)} SAT`} state={telemetry.gpsSatellites >= 7 ? "neutral" : "amber"} />
                    <HudCell label="VS" value={`${telemetry.verticalSpeed > 0 ? "+" : ""}${telemetry.verticalSpeed.toFixed(1)}m/s`} />
                    <HudCell label="DIST" value={`${telemetry.distance.toFixed(0)}m`} />
                </div>
            </div>

            {/* Critical Overlay */}
            {isCriticalBattery && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-destructive/15" />
                    <div className="px-4 py-3 border-2 border-destructive bg-background/80 text-destructive-foreground">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-[12px] font-black tracking-widest">CRITICAL BATTERY</span>
                        </div>
                        <div className="mt-1 text-[11px] font-mono font-bold tracking-tight text-muted-foreground">
                            {telemetry.battery.toFixed(0)}% • ~{telemetry.timeToEmpty.toFixed(0)} MIN
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function HudCell({
    label,
    value,
    state = "neutral",
}: {
    label: string
    value: string
    state?: "neutral" | "amber" | "red"
}) {
    const cls =
        state === "red"
            ? "border-destructive/70 text-destructive"
            : state === "amber"
                ? "border-amber-500/70 text-amber-400"
                : "border-border/40 text-foreground"

    return (
        <div className={`h-10 px-2 flex flex-col justify-center border bg-background/60 ${cls}`}>
            <div className="text-[9px] font-black tracking-widest text-muted-foreground">{label}</div>
            <div className="text-[12px] font-black tracking-tight">{value}</div>
        </div>
    )
}
