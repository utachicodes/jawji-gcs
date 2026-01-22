"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  Zap,
  Radio,
  Navigation,
  Box,
  FileText,
  ScanLine,
  Loader2
} from "lucide-react"
import { useMissionStore } from "@/lib/mission-store"
import { useDroneStore } from "@/lib/drone-store"

interface ChecklistItem {
  id: string
  category: string
  item: string
  status: "pending" | "pass" | "fail"
  critical: boolean
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case "POWER": return <Zap className="h-4 w-4 text-yellow-500" />
    case "SENSORS": return <ScanLine className="h-4 w-4 text-blue-500" />
    case "NAVIGATION": return <Navigation className="h-4 w-4 text-indigo-500" />
    case "COMM": return <Radio className="h-4 w-4 text-green-500" />
    case "SAFETY": return <Shield className="h-4 w-4 text-red-500" />
    case "PAYLOAD": return <Box className="h-4 w-4 text-purple-500" />
    case "COMPLIANCE": return <FileText className="h-4 w-4 text-slate-500" />
    default: return <CheckCircle2 className="h-4 w-4" />
  }
}

export function PreFlightChecklist({ missionId, onComplete }: { missionId?: string; onComplete?: () => void }) {
  const missions = useMissionStore((s) => s.missions)
  const mission = missions.find((m) => m.id === missionId)
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)
  const batteryPct = activeDrone?.battery ?? 0

  const [scanning, setScanning] = useState(true)
  const [scanProgress, setScanProgress] = useState(0)

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
    { id: "7", category: "NAVIGATION", item: "GPS Lock (>12 Satellites)", status: "pass", critical: true },
    { id: "8", category: "NAVIGATION", item: "Home position recorded", status: "pass", critical: false },
    { id: "9", category: "NAVIGATION", item: "Waypoints uploaded", status: (mission?.waypointData?.length || 0) > 0 ? "pass" : "fail", critical: true },
    { id: "10", category: "COMM", item: "RC Link Quality > 90%", status: "pass", critical: true },
    { id: "11", category: "COMM", item: "Telemetry Data Stream Active", status: "pass", critical: true },
    { id: "12", category: "COMM", item: "Video Downlink Stable", status: "pass", critical: false },
    { id: "13", category: "SAFETY", item: "Geofence Enforcement Active", status: mission?.geofence ? "pass" : "fail", critical: true },
    { id: "14", category: "SAFETY", item: "RTH Altitude Set (>30m)", status: "pass", critical: true },
    { id: "15", category: "SAFETY", item: "Props Secured & Undamaged", status: "pending", critical: true },
    { id: "16", category: "PAYLOAD", item: "Payload Secure", status: "pass", critical: true },
    { id: "17", category: "COMPLIANCE", item: "Airspace Authorization (LAANC)", status: "pending", critical: false },
  ]

  const [checklist, setChecklist] = useState<ChecklistItem[]>(fromMission || defaultChecklist)

  // Simulate system scan
  useEffect(() => {
    if (!scanning) return
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setScanning(false), 500)
          return 100
        }
        return prev + 5
      })
    }, 50)
    return () => clearInterval(interval)
  }, [scanning])

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id !== id) return item
      const nextStatus = item.status === "pending" ? "pass" : item.status === "pass" ? "fail" : "pass"
      return { ...item, status: nextStatus }
    }))
  }

  const passedItems = checklist.filter((item) => item.status === "pass").length
  const progress = (passedItems / checklist.length) * 100
  const allCriticalPassed = checklist.filter((item) => item.critical).every((item) => item.status === "pass")
  const allPassed = checklist.every((item) => item.status === "pass")

  if (scanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <ScanLine className="h-16 w-16 text-primary animate-pulse relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-mono font-bold">INITIALIZING SYSTEMS SCAN</h3>
          <p className="text-muted-foreground text-sm font-mono">Verifying hardware integrity...</p>
        </div>
        <Progress value={scanProgress} className="w-64 h-1" />
        <div className="font-mono text-xs text-muted-foreground">{scanProgress}% COMPLETE</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center justify-between border-b pb-4 border-white/5">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> PRE-FLIGHT CHECKS
          </h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-mono">
            <span>{mission?.name || "Manual Flight"}</span>
            <span>•</span>
            <span>{activeDrone?.name || "No Drone Selected"}</span>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={allPassed ? "default" : "outline"} className={`font-mono text-lg py-1 px-4 ${allPassed ? "bg-green-600 hover:bg-green-600" : "border-yellow-500 text-yellow-500"}`}>
            {allPassed ? "READY FOR FLIGHT" : "CHECKS PENDING"}
          </Badge>
        </div>
      </div>

      {/* CONTENT SPLIT */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN - STATUS SUMMARY */}
        <div className="lg:w-1/3 flex flex-col gap-6 h-full flex-shrink-0">
          <Card className="border-white/10 bg-card/40 backdrop-blur-md shadow-lg relative overflow-hidden flex-shrink-0">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-sm font-mono uppercase tracking-wider text-muted-foreground">
                Overall Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>COMPLETION</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-muted/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/20 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Critical</div>
                  <div className={`text-lg font-bold font-mono ${allCriticalPassed ? 'text-green-500' : 'text-red-500'}`}>
                    {allCriticalPassed ? "NOMINAL" : "ATTENTION"}
                  </div>
                </div>
                <div className="bg-background/20 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Checks</div>
                  <div className="text-lg font-bold font-mono">
                    {passedItems}/{checklist.length}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  className="flex-1 border-white/10 hover:bg-white/5 hover:border-white/20"
                  variant="outline"
                  onClick={() => {
                    setScanning(true)
                    setScanProgress(0)
                  }}
                >
                  <ScanLine className="mr-2 h-4 w-4" /> Re-scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* LAUNCH BUTTON */}
          <Card className="flex-1 border-white/10 bg-card/40 backdrop-blur-md flex flex-col items-center justify-center p-6 shadow-lg">
            <Button
              size="lg"
              className={`
                            w-full h-24 text-2xl font-bold font-mono tracking-wider shadow-[0_0_50px_-15px_rgba(var(--primary-rgb),0.3)]
                            transition-all duration-300
                            ${allPassed ? 'bg-green-600 hover:bg-green-500 hover:scale-[1.02] hover:shadow-[0_0_60px_-10px_rgba(34,197,94,0.6)]' : 'opacity-30 grayscale cursor-not-allowed bg-muted'}
                        `}
              disabled={!allPassed}
              onClick={onComplete}
            >
              {allPassed ? (
                <span className="flex flex-col items-center gap-2">
                  <Zap className="h-8 w-8 animate-pulse text-white" />
                  <span className="text-white">INITIATE LAUNCH</span>
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8" />
                  AWAITING CHECKS
                </span>
              )}
            </Button>
          </Card>
        </div>

        {/* RIGHT COLUMN - SCROLLABLE CHECKLIST */}
        <Card className="flex-1 border-white/10 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col shadow-lg">
          <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <ScanLine className="h-4 w-4" /> Diagnostics & Systems
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 bg-transparent">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                {["POWER", "SENSORS", "NAVIGATION", "COMM", "SAFETY", "PAYLOAD", "COMPLIANCE", "MISSION"].map((cat) => {
                  const categoryItems = checklist.filter(i => i.category === cat)
                  if (categoryItems.length === 0) return null

                  const isCatComplete = categoryItems.every(i => i.status === "pass")

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 px-1 flex items-center justify-between border-b border-white/5 mb-2">
                        <h4 className="text-xs font-bold font-mono text-muted-foreground flex items-center gap-2">
                          <CategoryIcon category={cat} /> {cat}
                        </h4>
                        {isCatComplete && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => !scanning && toggleItem(item.id)}
                            className={`
                                                        group flex items-center justify-between p-3 rounded-md border text-sm transition-all cursor-pointer
                                                        ${item.status === 'pass'
                                ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                                : item.status === 'fail'
                                  ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                                  : 'bg-card border-white/5 hover:border-primary/30'
                              }
                                                    `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                                             h-5 w-5 rounded-full border flex items-center justify-center transition-colors
                                                             ${item.status === 'pass'
                                  ? 'bg-green-500 border-green-500 text-black'
                                  : 'border-muted-foreground group-hover:border-primary'
                                }
                                                         `}>
                                {item.status === 'pass' && <CheckCircle2 className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`font-mono ${item.status === 'pass' ? 'text-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'}`}>
                                  {item.item}
                                </span>
                                {item.critical && (
                                  <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider">Critical</span>
                                )}
                              </div>
                            </div>

                            {item.status === 'pass' && (
                              <span className="text-[10px] font-mono text-green-500">OK</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
