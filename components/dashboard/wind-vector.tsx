"use client"

import { Wind } from "lucide-react"

interface WindVectorProps {
    speed: number
    direction: number
    className?: string
}

export function WindVector({ speed, direction, className }: WindVectorProps) {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <div className="relative h-12 w-12 flex items-center justify-center">
                {/* Circular Compass Grid */}
                <div className="absolute inset-0 rounded-full border border-white/5 bg-black/20" />
                <div className="absolute inset-1 rounded-full border border-white/5" />

                {/* Vector Arrow */}
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${direction}deg)` }}
                >
                    <div className="h-[70%] w-0.5 bg-emerald-500 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-emerald-500" />
                    </div>
                </div>

                {/* Speed Value */}
                <div className="relative z-10 bg-black/40 px-1 rounded-sm border border-white/10">
                    <span className="text-[8px] font-black text-emerald-400">{speed.toFixed(1)}</span>
                </div>
            </div>
            <div className="flex flex-col items-center -mt-1">
                <span className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em]">Wind Vector</span>
                <span className="text-[8px] font-bold text-white/50">{direction.toFixed(0)}°</span>
            </div>
        </div>
    )
}
