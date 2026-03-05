"use client"

export function CenterCrosshair({ pitch = 0 }: { pitch?: number }) {
    const pitchLines = [-10, 0, 10]

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Pitch Ladder */}
                <div
                    className="relative flex flex-col items-center gap-0 transition-transform duration-500 ease-out"
                    style={{ transform: `translateY(${pitch * 4}px)` }}
                >
                    {pitchLines.map((line) => (
                        <div
                            key={line}
                            className="flex items-center gap-4"
                            style={{ margin: line === 0 ? 0 : "30px 0" }}
                        >
                            <div className="flex items-center gap-2">
                                {line !== 0 && (
                                    <span className="text-[8px] text-white/40 font-mono w-4 text-right tabular-nums">{line > 0 ? `+${line}` : line}</span>
                                )}
                                <div className={`h-[0.5px] bg-white/20 ${line === 0 ? "w-24" : "w-10"}`} />
                            </div>

                            {/* Fixed reference gap at center */}
                            {line === 0 && <div className="w-12" />}

                            <div className="flex items-center gap-2 flex-row-reverse">
                                <div className={`h-[0.5px] bg-white/20 ${line === 0 ? "w-24" : "w-10"}`} />
                                {line !== 0 && (
                                    <span className="text-[8px] text-white/40 font-mono w-4 text-left tabular-nums">{line > 0 ? `+${line}` : line}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fixed Center Reticle */}
                <div className="absolute">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        {/* Center brackets */}
                        <path d="M42 50 H46 M54 50 H58" stroke="white" strokeWidth="1" strokeOpacity="0.8" />
                        <path d="M50 42 V46 M50 54 V58" stroke="white" strokeWidth="1" strokeOpacity="0.8" />

                        {/* Outer corners / ticks */}
                        <path d="M48 35 H52 M48 65 H52" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
                        <path d="M35 48 V52 M65 48 V52" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />

                        {/* Center point */}
                        <rect x="49.5" y="49.5" width="1" height="1" fill="white" fillOpacity="0.8" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
