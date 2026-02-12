"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, Home, Navigation, AlertCircle, Camera, Target, Users, RotateCcw, ChevronDown } from "lucide-react"
import { EmergencyAbort } from "@/components/emergency-abort"

export function ControlBar({ className }: { className?: string }) {
    return (
        <div className={`grid grid-cols-12 gap-4 shrink-0 ${className}`}>

            {/* Primary Actions */}
            <div className="col-span-8 grid grid-cols-4 gap-4">
                <ActionButton
                    label="Takeoff"
                    sub="Auto ascend to 5m"
                    icon={<Navigation className="h-5 w-5" />}
                    variant="orange"
                />
                <ActionButton
                    label="RTH"
                    sub="Return to home"
                    icon={<Home className="h-5 w-5" />}
                    variant="teal"
                />
                <ActionButton
                    label="Land"
                    sub="Controlled descent"
                    icon={<Target className="h-5 w-5" />}
                    variant="green"
                />
                <div className="col-span-1 flex gap-4 h-full">
                    <EmergencyAbort className="flex-1 h-full rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                </div>
            </div>

            {/* Secondary Status / Toggles */}
            <Card className="col-span-12 lg:col-span-4 bg-muted/20 dark:bg-black/40 border-border/40 grid grid-cols-4 gap-2 p-2 shadow-inner glass-panel rounded-xl">
                <StatusToggle label="Record" icon={<Camera />} />
                <StatusToggle label="Gimbal" icon={<Target />} />
                <StatusToggle label="Follow" icon={<Users />} />
                <StatusToggle label="Orbit" icon={<RotateCcw />} />
            </Card>
        </div>
    )
}

function ActionButton({ label, sub, icon, variant }: { label: string, sub: string, icon: React.ReactNode, variant: 'orange' | 'teal' | 'green' | 'red' }) {
    const styles = {
        orange: "bg-[#f59e0b] hover:bg-[#d97706] text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]",
        teal: "bg-teal-500 hover:bg-teal-600 text-black shadow-[0_0_20px_rgba(20,184,166,0.2)]",
        green: "bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]",
        red: "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse",
    }

    return (
        <Button variant="ghost" className={`h-full min-h-[64px] rounded-xl flex items-center justify-start gap-4 px-4 transition-all duration-200 active:scale-95 ${styles[variant]}`}>
            <div className={`bg-black/10 p-2 rounded-lg border border-black/10 shadow-inner`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })}
            </div>
            <div className="text-left flex flex-col">
                <span className="text-xs font-black uppercase tracking-[0.2em]">{label}</span>
                <span className="text-[9px] opacity-70 font-bold uppercase tracking-widest">{sub}</span>
            </div>
        </Button>
    )
}

function StatusToggle({ label, icon }: { label: string, icon: React.ReactElement }) {
    return (
        <Button variant="ghost" className="h-full flex flex-col items-center justify-center gap-1 hover:bg-accent group border border-transparent hover:border-border/40 rounded-lg transition-all">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" })}
            <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 group-hover:opacity-100">{label}</span>
        </Button>
    )
}
