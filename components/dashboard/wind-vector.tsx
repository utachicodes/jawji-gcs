"use client"

interface WindVectorProps {
    speed: number
    direction: number
    className?: string
}

export function WindVector({ speed, direction, className }: WindVectorProps) {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <div className="relative h-12 w-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-border/20 bg-background/20" />
                <div className="absolute inset-1 rounded-full border border-border/10" />
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${direction}deg)` }}
                >
                    <div className="h-[70%] w-0.5 bg-primary relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-primary" />
                    </div>
                </div>
                <div className="relative z-10 bg-background/60 px-1 rounded-sm border border-border/20">
                    <span className="text-[8px] font-black text-primary">{speed.toFixed(1)}</span>
                </div>
            </div>
            <div className="flex flex-col items-center -mt-1">
                <span className="text-[6px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Wind Vector</span>
                <span className="text-[8px] font-bold text-muted-foreground">{direction.toFixed(0)}°</span>
            </div>
        </div>
    )
}
