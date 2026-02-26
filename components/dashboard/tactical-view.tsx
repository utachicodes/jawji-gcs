"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MissionProgress } from "@/components/mission-progress"

interface TacticalViewProps {
    mapElement: React.ReactNode
    mapMode: "2D" | "3D"
    onToggleMapMode: () => void
    className?: string
}

export function TacticalView({ mapElement, mapMode, onToggleMapMode }: TacticalViewProps) {
    return (
        <div className="flex flex-col gap-3 h-full min-h-0">

            {/* Map — takes all remaining vertical space */}
            <Card className="flex-1 relative bg-background/60 dark:bg-background/40 backdrop-blur-xl border-border/40 overflow-hidden rounded-xl min-h-0">
                {/* Map mode toggle */}
                <div className="absolute top-2 right-2 z-20 flex border border-border/60 rounded overflow-hidden shadow-lg">
                    <Button
                        variant={mapMode === "2D" ? "default" : "ghost"}
                        size="sm"
                        className="h-5 px-3 text-[8px] rounded-none uppercase font-black"
                        onClick={onToggleMapMode}
                    >2D</Button>
                    <Button
                        variant={mapMode === "3D" ? "default" : "ghost"}
                        size="sm"
                        className="h-5 px-3 text-[8px] rounded-none uppercase font-black"
                        onClick={onToggleMapMode}
                    >3D</Button>
                </div>

                {/* Map fills the card */}
                <div className="absolute inset-0 grayscale contrast-125 brightness-100 dark:brightness-75 transition-all">
                    {mapElement}
                </div>
            </Card>

            {/* Mission progress — only rendered when there is an active mission */}
            <MissionProgress />

        </div>
    )
}
