"use client"

import { Camera, Image, Settings2, Circle } from "lucide-react"
import { useState } from "react"

function CameraStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col items-center py-1.5 border-b border-white/5 w-full last:border-0">
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black font-mono text-white tracking-tight leading-none mt-0.5">{value}</span>
        </div>
    )
}

function ActionBtn({
    icon,
    active,
    danger,
    onClick,
}: {
    icon: React.ReactNode
    active?: boolean
    danger?: boolean
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 
        ${danger
                    ? active
                        ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
                        : "bg-red-600/80 hover:bg-red-500 text-white"
                    : active
                        ? "bg-[hsl(var(--primary)/0.2)] border-[hsl(var(--primary))] border text-[hsl(var(--primary))]"
                        : "bg-black/40 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white"
                }`}
        >
            {icon}
        </button>
    )
}

export function RightActionPanel() {
    const [recording, setRecording] = useState(false)

    return (
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
            {/* Camera Stats Card */}
            <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-[1.25rem] py-1.5 flex flex-col items-center w-12 shadow-2xl">
                <CameraStat label="ISO" value="100" />
                <CameraStat label="SHUTTER" value="1/500" />
                <CameraStat label="EV" value="0.0" />
                <CameraStat label="RES" value="4K/60" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
                <ActionBtn
                    icon={<Circle className="h-3.5 w-3.5" fill={recording ? "currentColor" : "none"} />}
                    danger
                    active={recording}
                    onClick={() => setRecording(r => !r)}
                />
                <ActionBtn icon={<Image className="h-3.5 w-3.5" />} />
                <ActionBtn icon={<Camera className="h-3.5 w-3.5" />} />
            </div>
        </div>
    )
}
