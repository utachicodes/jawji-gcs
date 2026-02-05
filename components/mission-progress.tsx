"use client"

import { useMissionStore } from "@/lib/mission-store"
import { useDroneStore } from "@/lib/drone-store"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, MapPin, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function MissionProgress() {
    const { missions, activeMissionId } = useMissionStore()
    const { drones, selectedDrone } = useDroneStore()

    const mission = missions.find(m => m.id === activeMissionId)
    const drone = drones.find(d => d.id === selectedDrone)

    if (!mission || !drone || !drone.location) {
        return (
            <Card className="p-4">
                <div className="text-center text-sm text-muted-foreground">
                    No active mission
                </div>
            </Card>
        )
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
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{mission.name}</span>
                    </div>
                    <Badge variant={mission.status === "active" ? "default" : "secondary"}>
                        {mission.status}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Mission Progress</span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Waypoints</div>
                    <div className="space-y-1 max-h-32 overflow-auto">
                        {waypoints.map((wp, idx) => (
                            <div
                                key={wp.id}
                                className={`flex items-center gap-2 text-sm p-1.5 rounded ${idx === nearestWaypointIndex
                                        ? 'bg-primary/10 text-primary'
                                        : idx < nearestWaypointIndex
                                            ? 'text-muted-foreground'
                                            : ''
                                    }`}
                            >
                                {idx < nearestWaypointIndex ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : idx === nearestWaypointIndex ? (
                                    <MapPin className="h-3 w-3 text-primary animate-pulse" />
                                ) : (
                                    <Circle className="h-3 w-3" />
                                )}
                                <span className="text-xs">WP {idx + 1}</span>
                                <span className="text-xs text-muted-foreground">• {wp.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    )
}
