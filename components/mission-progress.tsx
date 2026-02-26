"use client"

import { useMissionStore } from "@/lib/mission-store"
import { useDroneStore } from "@/lib/drone-store"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function MissionProgress() {
    const { missions, activeMissionId } = useMissionStore()
    const { drones, selectedDrone } = useDroneStore()

    const mission = missions.find(m => m.id === activeMissionId)
    const drone = drones.find(d => d.id === selectedDrone)

    if (!mission || !drone || !drone.location) {
        return null
    }

    // Calculate mission progress
    const waypoints = mission.waypointData || []
    const totalWaypoints = waypoints.length

    // Find nearest waypoint (simplified - in real system would track completed waypoints)
    let nearestWaypointIndex = 0
    let minDistance = Infinity

    waypoints.forEach((wp, idx) => {
        const distance = Math.sqrt(
            Math.pow(drone.location!.lat - wp.lat, 2) +
            Math.pow(drone.location!.lng - wp.lng, 2)
        )
        if (distance < minDistance) {
            minDistance = distance
            nearestWaypointIndex = idx
        }
    })

    const progress = totalWaypoints > 0 ? (nearestWaypointIndex / totalWaypoints) * 100 : 0

    return (
        <Card className="p-4 rounded-xl bg-black/5 dark:bg-black/20 border-border/20">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{mission.name}</span>
                    </div>
                    <Badge variant={mission.status === "active" ? "default" : "secondary"} className="rounded-sm text-[8px] px-1.5 h-4 font-black uppercase tracking-tighter">
                        {mission.status}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-muted-foreground">Flight Progress</span>
                        <span className="font-mono text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1 bg-muted/20" />
                </div>

                <div className="space-y-2">
                    <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Flight Sequence</div>
                    <div className="space-y-1 max-h-32 overflow-auto custom-scrollbar">
                        {waypoints.map((wp, idx) => (
                            <div
                                key={wp.id}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border border-transparent transition-colors ${idx === nearestWaypointIndex
                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                    : idx < nearestWaypointIndex
                                        ? 'opacity-40'
                                        : 'hover:bg-muted/30'
                                    }`}
                            >
                                {idx < nearestWaypointIndex ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                ) : idx === nearestWaypointIndex ? (
                                    <div className="h-3 w-3 rounded-full border-2 border-primary flex items-center justify-center">
                                        <div className="h-1 w-1 bg-primary rounded-full" />
                                    </div>
                                ) : (
                                    <Circle className="h-3 w-3 opacity-20" />
                                )}
                                <span className="text-[10px] font-black tracking-tighter">WP {idx + 1}</span>
                                <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">• {wp.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    )
}
