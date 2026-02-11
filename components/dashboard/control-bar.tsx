"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, Home, Navigation, AlertCircle, Camera, Target, Users, RotateCcw } from "lucide-react"
import { EmergencyAbort } from "@/components/emergency-abort"

export function ControlBar() {
    return (
        <div className="grid grid-cols-12 gap-4 shrink-0">

            {/* Primary Actions */}
            <div className="col-span-8 grid grid-cols-4 gap-4">
                <ActionButton
                    label="Takeoff"
                    sub="Auto ascend to 5m"
                    icon={<Plane className="h-5 w-5" />}
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
                    icon={<Navigation className="h-5 w-5" />}
                    variant="green"
                />
                <div className="col-span-1 flex gap-4 h-full">
                    <EmergencyAbort className="flex-1 h-full rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                </div>
            </div>

            {/* Secondary Status / Toggles */}
            <Card className="col-span-4 glass-panel bg-muted/20 border-border/40 grid grid-cols-4 gap-2 p-2">
                <StatusToggle label="Start Rec" icon={<Camera />} />
                <StatusToggle label="Gimbal" icon={<Target />} />
                <StatusToggle label="Follow" icon={<Users />} />
                <StatusToggle label="Orbit" icon={<RotateCcw />} />
            </Card>
        </div>
    )
}

function ActionButton({ label, sub, icon, variant }: { label: string, sub: string, icon: React.ReactNode, variant: 'orange' | 'teal' | 'green' | 'red' }) {
    const styles = {
        orange: "bg-orange-500 hover:bg-orange-600 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]",
        teal: "bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/50",
        green: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50",
        red: "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    }

    return (
        <Button variant="ghost" className={`h-16 rounded-xl flex items-center justify-start gap-4 px-4 transition-all duration-200 active:scale-95 ${styles[variant]}`}>
            <div className={`${variant === 'orange' || variant === 'red' ? 'bg-black/20' : 'bg-current opacity-20'} p-2 rounded-lg`}>
                {icon}
            </div>
            <div className="text-left flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest">{label}</span>
                <span className="text-[10px] opacity-70 font-bold">{sub}</span>
            </div>
        </Button>
    )
}

function StatusToggle({ label, icon }: { label: string, icon: React.ReactElement }) {
    return (
        <Button variant="ghost" className="h-full flex flex-col items-center justify-center gap-1 hover:bg-white/5 group border border-transparent hover:border-white/10 rounded-lg">
            {React.cloneElement(icon, { className: "h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" })}
            <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 group-hover:opacity-100">{label}</span>
        </Button>
    )
}
