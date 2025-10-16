"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ChecklistItem {
  id: string
  category: string
  item: string
  status: "pending" | "pass" | "fail"
  critical: boolean
}

export function PreFlightChecklist({ onComplete }: { onComplete?: () => void }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", category: "POWER", item: "Battery voltage > 22.0V", status: "pass", critical: true },
    { id: "2", category: "POWER", item: "Battery capacity > 80%", status: "pass", critical: true },
    { id: "3", category: "POWER", item: "Battery temperature nominal", status: "pass", critical: true },
    { id: "4", category: "SENSORS", item: "IMU calibration valid", status: "pass", critical: true },
    { id: "5", category: "SENSORS", item: "Magnetometer calibration valid", status: "pass", critical: true },
    { id: "6", category: "SENSORS", item: "Barometer operational", status: "pass", critical: true },
    { id: "7", category: "SENSORS", item: "Visual odometry initialized", status: "pass", critical: true },
    { id: "8", category: "NAVIGATION", item: "SLAM system ready", status: "pass", critical: true },
    { id: "9", category: "NAVIGATION", item: "Obstacle detection active", status: "pass", critical: true },
    { id: "10", category: "NAVIGATION", item: "Home position set", status: "pass", critical: false },
    { id: "11", category: "COMM", item: "Telemetry link established", status: "pass", critical: true },
    { id: "12", category: "COMM", item: "Command link latency < 100ms", status: "pass", critical: true },
    { id: "13", category: "COMM", item: "Video stream active", status: "pass", critical: false },
    { id: "14", category: "SAFETY", item: "Geofence configured", status: "pass", critical: true },
    { id: "15", category: "SAFETY", item: "Return-to-launch altitude set", status: "pass", critical: true },
    { id: "16", category: "SAFETY", item: "Emergency procedures loaded", status: "pass", critical: true },
    { id: "17", category: "PAYLOAD", item: "Camera operational", status: "pass", critical: false },
    { id: "18", category: "PAYLOAD", item: "Gimbal calibrated", status: "pass", critical: false },
  ])

  const categories = Array.from(new Set(checklist.map((item) => item.category)))
  const passedItems = checklist.filter((item) => item.status === "pass").length
  const failedItems = checklist.filter((item) => item.status === "fail").length
  const progress = (passedItems / checklist.length) * 100

  const allCriticalPassed = checklist.filter((item) => item.critical).every((item) => item.status === "pass")

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono">PRE-FLIGHT CHECKLIST</CardTitle>
            <Badge variant={allCriticalPassed ? "default" : "destructive"} className="font-mono">
              {allCriticalPassed ? "READY" : "NOT READY"}
            </Badge>
          </div>
        </CardHeader>
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
            <div>
              <div className="text-2xl font-bold text-green-500">{passedItems}</div>
              <div className="text-muted-foreground">PASSED</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{failedItems}</div>
              <div className="text-muted-foreground">FAILED</div>
            </div>
            <div>
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
                    <Badge
                      variant={item.status === "pass" ? "default" : item.status === "fail" ? "destructive" : "outline"}
                      className="font-mono text-xs"
                    >
                      {item.status.toUpperCase()}
                    </Badge>
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
