"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useMissionStore } from "@/lib/mission-store"
import { useDroneStore } from "@/lib/drone-store"

interface ChecklistItem {
  id: string
  category: string
  item: string
  status: "pending" | "pass" | "fail"
  critical: boolean
}

export function PreFlightChecklist({ missionId, onComplete }: { missionId?: string; onComplete?: () => void }) {
  const missions = useMissionStore((s) => s.missions)
  const mission = missions.find((m) => m.id === missionId)
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)
  const batteryPct = activeDrone?.battery ?? 0
  const fromMission: ChecklistItem[] | null = mission?.checklist
    ? mission.checklist.map((txt, idx) => ({
        id: String(idx + 1),
        category: "MISSION",
        item: txt,
        status: "pending",
        critical: true,
      }))
    : null
  const defaultChecklist: ChecklistItem[] = [
    { id: "1", category: "POWER", item: "Battery voltage > 22.0V", status: batteryPct > 0 ? "pass" : "fail", critical: true },
    { id: "2", category: "POWER", item: "Battery capacity > 80%", status: batteryPct >= 80 ? "pass" : "fail", critical: true },
    { id: "3", category: "POWER", item: "Battery temperature nominal", status: "pass", critical: true },
    { id: "4", category: "SENSORS", item: "IMU calibration valid", status: "pass", critical: true },
    { id: "5", category: "SENSORS", item: "Magnetometer calibration valid", status: "pass", critical: true },
    { id: "6", category: "SENSORS", item: "Barometer operational", status: "pass", critical: true },
    { id: "7", category: "SENSORS", item: "Visual odometry initialized", status: "pass", critical: true },
    { id: "8", category: "NAVIGATION", item: "SLAM system ready", status: "pass", critical: true },
    { id: "9", category: "NAVIGATION", item: "Obstacle detection active", status: "pass", critical: true },
    { id: "10", category: "NAVIGATION", item: "Waypoints configured", status: (mission?.waypointData?.length || 0) > 0 ? "pass" : "fail", critical: true },
    { id: "11", category: "NAVIGATION", item: "Home position set", status: "pass", critical: false },
    { id: "12", category: "COMM", item: "Telemetry link established", status: "pass", critical: true },
    { id: "13", category: "COMM", item: "Command link latency < 100ms", status: "pass", critical: true },
    { id: "14", category: "COMM", item: "Video stream active", status: "pass", critical: false },
    { id: "15", category: "SAFETY", item: "Geofence configured", status: mission?.geofence ? "pass" : "fail", critical: true },
    { id: "16", category: "SAFETY", item: "Return-to-launch altitude set", status: "pass", critical: true },
    { id: "17", category: "SAFETY", item: "Emergency procedures loaded", status: "pass", critical: true },
    { id: "18", category: "COMPLIANCE", item: "NOTAMs reviewed", status: "pending", critical: true },
    { id: "19", category: "PAYLOAD", item: "Camera operational", status: "pass", critical: false },
    { id: "20", category: "PAYLOAD", item: "Gimbal calibrated", status: "pass", critical: false },
  ]
  const [checklist, setChecklist] = useState<ChecklistItem[]>(fromMission || defaultChecklist)

  const categories = Array.from(new Set(checklist.map((item) => item.category)))
  const passedItems = checklist.filter((item) => item.status === "pass").length
  const failedItems = checklist.filter((item) => item.status === "fail").length
  const progress = (passedItems / checklist.length) * 100

  const allCriticalPassed = checklist.filter((item) => item.critical).every((item) => item.status === "pass")

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-mono tracking-wide">PRE-FLIGHT CHECKLIST</CardTitle>
              <Badge variant={allCriticalPassed ? "default" : "destructive"} className="font-mono">
                {allCriticalPassed ? "READY" : "NOT READY"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {mission && <Badge variant="outline" className="font-mono">Mission: {mission.name}</Badge>}
              {activeDrone && <Badge variant="outline" className="font-mono">Drone: {activeDrone.name}</Badge>}
              <Badge variant="outline" className="font-mono">Waypoints: {mission?.waypointData?.length ?? 0}</Badge>
            </div>
          </CardHeader>
        </div>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-mono">
              <span>COMPLETION</span>
              <span>
                {passedItems}/{checklist.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm font-mono">
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-2xl font-bold text-green-500">{passedItems}</div>
              <div className="text-muted-foreground">PASSED</div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-2xl font-bold text-red-500">{failedItems}</div>
              <div className="text-muted-foreground">FAILED</div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-2xl font-bold text-yellow-500">{checklist.length - passedItems - failedItems}</div>
              <div className="text-muted-foreground">PENDING</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-sm font-mono">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist
                .filter((item) => item.category === category)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          item.status === "pass"
                            ? "bg-green-500"
                            : item.status === "fail"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm font-mono">{item.item}</span>
                      {item.critical && (
                        <Badge variant="outline" className="text-xs font-mono">
                          CRITICAL
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.category === "COMPLIANCE" && item.item.toLowerCase().includes("notams") && item.status !== "pass" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 bg-transparent"
                          onClick={() =>
                            setChecklist((prev) =>
                              prev.map((it) =>
                                it.id === item.id ? { ...it, status: "pass" } : it,
                              ),
                            )
                          }
                        >
                          Review
                        </Button>
                      )}
                      <Badge
                        variant={item.status === "pass" ? "default" : item.status === "fail" ? "destructive" : "outline"}
                        className="font-mono text-xs cursor-pointer"
                        onClick={() =>
                          setChecklist((prev) =>
                            prev.map((it) =>
                              it.id === item.id
                                ? { ...it, status: it.status === "pending" ? "pass" : it.status === "pass" ? "fail" : "pending" }
                                : it,
                            ),
                          )
                        }
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button className="flex-1 h-12 font-mono" disabled={!allCriticalPassed} onClick={onComplete}>
          PROCEED TO FLIGHT
        </Button>
        <Button variant="outline" className="h-12 font-mono bg-transparent">
          RUN DIAGNOSTICS
        </Button>
      </div>
    </div>
  )
}
