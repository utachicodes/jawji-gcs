"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useGamepad } from "@/hooks/use-gamepad"
import { useDroneStore } from "@/lib/drone-store"
import {
  Play, Square, Home, ArrowUp, ArrowDown, Camera, Video,
  Zap, AlertCircle, Gauge, Mountain, Signal, Battery,
  Satellite, Wind, Pause, Power, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

type FlightMode = "normal" | "sport" | "cinematic" | "tripod"

const MODE_CONFIG: Record<FlightMode, { maxSpeed: number; maxAlt: number; expo: number; label: string; description: string; color: string }> = {
  normal:    { maxSpeed: 15, maxAlt: 120, expo: 0.3, label: "Normal",    description: "Balanced speed & precision", color: "bg-blue-500" },
  sport:     { maxSpeed: 25, maxAlt: 200, expo: 0.1, label: "Sport",     description: "Maximum speed, reduced safety", color: "bg-orange-500" },
  cinematic: { maxSpeed: 8,  maxAlt: 120, expo: 0.7, label: "Cinematic", description: "Ultra-smooth for photography", color: "bg-purple-500" },
  tripod:    { maxSpeed: 3,  maxAlt: 50,  expo: 0.9, label: "Tripod",    description: "Ultra-precise micro movements", color: "bg-green-500" },
}

const MODE_ICONS: Record<FlightMode, React.ReactNode> = {
  normal:    <Gauge className="h-4 w-4" />,
  sport:     <Zap className="h-4 w-4" />,
  cinematic: <Video className="h-4 w-4" />,
  tripod:    <Mountain className="h-4 w-4" />,
}

export function DroneControl() {
  const { drones, selectedDrone: selectedDroneId } = useDroneStore()
  const drone = drones.find((d) => d.id === selectedDroneId) ?? drones[0]

  const [isArmed, setIsArmed] = useState(false)
  const [flightMode, setFlightMode] = useState<FlightMode>("normal")
  const [leftJoystick, setLeftJoystick] = useState({ x: 0, y: 0 })
  const [rightJoystick, setRightJoystick] = useState({ x: 0, y: 0 })
  const [gimbalPitch, setGimbalPitch] = useState([0])
  const [gimbalYaw, setGimbalYaw] = useState([0])
  const [zoom, setZoom] = useState([1])
  const [maxSpeed, setMaxSpeed] = useState([10])
  const [maxAltitude, setMaxAltitude] = useState([100])
  const [rthAltitude, setRthAltitude] = useState([50])
  const [isRecording, setIsRecording] = useState(false)
  const [hoverHold, setHoverHold] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [flightTime, setFlightTime] = useState(0)
  const flightTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<null | "arm" | "disarm" | "takeoff" | "land" | "rtl" | "stop">(null)

  const gp = useGamepad(true)

  // Gamepad integration
  useEffect(() => {
    setLeftJoystick({ x: gp.left.x, y: -gp.left.y })
    setRightJoystick({ x: gp.right.x, y: -gp.right.y })
  }, [gp.left.x, gp.left.y, gp.right.x, gp.right.y])

  // Flight timer
  useEffect(() => {
    if (isArmed) {
      flightTimerRef.current = setInterval(() => setFlightTime((t) => t + 1), 1000)
    } else {
      if (flightTimerRef.current) clearInterval(flightTimerRef.current)
      setFlightTime(0)
    }
    return () => { if (flightTimerRef.current) clearInterval(flightTimerRef.current) }
  }, [isArmed])

  // Keyboard control
  useEffect(() => {
    if (!keyboardMode) return
    const modeConfig = MODE_CONFIG[flightMode]
    const step = 0.4

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for control keys
      if (["w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Escape"].includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key) {
        // Left joystick: Throttle (W/S) + Yaw (A/D)
        case "w": setLeftJoystick((p) => ({ ...p, y: Math.min(1, p.y + step) })); break
        case "s": setLeftJoystick((p) => ({ ...p, y: Math.max(-1, p.y - step) })); break
        case "a": setLeftJoystick((p) => ({ ...p, x: Math.max(-1, p.x - step) })); break
        case "d": setLeftJoystick((p) => ({ ...p, x: Math.min(1, p.x + step) })); break
        // Right joystick: Pitch (ArrowUp/Down) + Roll (ArrowLeft/Right)
        case "ArrowUp":    setRightJoystick((p) => ({ ...p, y: Math.min(1, p.y + step) })); break
        case "ArrowDown":  setRightJoystick((p) => ({ ...p, y: Math.max(-1, p.y - step) })); break
        case "ArrowLeft":  setRightJoystick((p) => ({ ...p, x: Math.max(-1, p.x - step) })); break
        case "ArrowRight": setRightJoystick((p) => ({ ...p, x: Math.min(1, p.x + step) })); break
        case " ": if (!isArmed) requestAction("arm"); break
        case "Escape": requestAction("stop"); break
        case "h": setHoverHold((v) => !v); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["w","s"].includes(e.key)) setLeftJoystick((p) => ({ ...p, y: 0 }))
      if (["a","d"].includes(e.key)) setLeftJoystick((p) => ({ ...p, x: 0 }))
      if (["ArrowUp","ArrowDown"].includes(e.key)) setRightJoystick((p) => ({ ...p, y: 0 }))
      if (["ArrowLeft","ArrowRight"].includes(e.key)) setRightJoystick((p) => ({ ...p, x: 0 }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [keyboardMode, isArmed, flightMode])

  const requestAction = (action: typeof pendingAction) => {
    if (action === "stop") {
      // Emergency stop - no confirmation
      setIsArmed(false)
      toast.error("EMERGENCY STOP — Motors disarmed")
      return
    }
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const runAction = () => {
    if (!pendingAction) return
    switch (pendingAction) {
      case "arm":
        setIsArmed(true)
        toast.success("Drone armed — motors enabled")
        break
      case "disarm":
        setIsArmed(false)
        toast("Drone disarmed")
        break
      case "takeoff":
        if (!isArmed) { toast.error("Arm the drone first"); break }
        toast.success("Takeoff initiated")
        break
      case "land":
        toast("Landing initiated")
        break
      case "rtl":
        toast("Return-to-Home initiated")
        break
    }
    setConfirmOpen(false)
    setPendingAction(null)
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // Live telemetry from drone store
  const battery = drone?.battery ?? 0
  const altitude = drone?.location?.altitude ?? 0
  const speed = drone?.speed ?? 0
  const gps = drone?.gpsSatellites ?? 0
  const signal = drone?.signal ?? 0
  const batteryColor = battery > 40 ? "text-green-400" : battery > 20 ? "text-yellow-400" : "text-red-400"

  return (
    <>
      <div className="h-full flex flex-col gap-4 p-4 overflow-auto">

        {/* A. Status Banner */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-xl">
          {/* Armed badge */}
          <Badge variant={isArmed ? "destructive" : "outline"} className="text-xs font-bold px-3 py-1">
            {isArmed ? "ARMED" : "DISARMED"}
          </Badge>

          {/* Battery */}
          <div className="flex items-center gap-1.5">
            <Battery className={`h-4 w-4 ${batteryColor}`} />
            <span className={`text-sm font-mono font-semibold ${batteryColor}`}>{battery.toFixed(0)}%</span>
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${battery > 40 ? "bg-green-400" : battery > 20 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: `${battery}%` }} />
            </div>
          </div>

          {/* Signal */}
          <div className="flex items-center gap-1.5">
            <Signal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">{signal.toFixed(0)}%</span>
          </div>

          {/* Altitude */}
          <div className="flex items-center gap-1.5">
            <Mountain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">{altitude.toFixed(1)} m</span>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">{speed.toFixed(1)} m/s</span>
          </div>

          {/* GPS */}
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${gps >= 6 ? "bg-green-400" : "bg-red-400"}`} />
            <Satellite className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">{gps} sats</span>
          </div>

          {/* Flight timer */}
          {isArmed && (
            <div className="ml-auto flex items-center gap-1.5 text-sm font-mono text-primary">
              <Play className="h-3 w-3" />
              {formatTime(flightTime)}
            </div>
          )}

          {/* Mode */}
          {drone && (
            <span className="text-xs text-muted-foreground">{drone.mode}</span>
          )}
        </div>

        {!isArmed && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Arm the drone before attempting manual control. Press <kbd className="px-1 rounded bg-muted text-xs">Space</kbd> or click Arm.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">

          {/* B. Flight Mode Panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Flight Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(MODE_CONFIG) as FlightMode[]).map((mode) => {
                const cfg = MODE_CONFIG[mode]
                const active = flightMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setFlightMode(mode)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${cfg.color} text-white`}>
                      {MODE_ICONS[mode]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{cfg.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{cfg.description}</div>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                )
              })}

              {/* Mode limits */}
              <div className="pt-2 border-t border-border space-y-1 text-[11px] text-muted-foreground">
                <div className="flex justify-between"><span>Max Speed</span><span className="font-mono text-foreground">{MODE_CONFIG[flightMode].maxSpeed} m/s</span></div>
                <div className="flex justify-between"><span>Max Altitude</span><span className="font-mono text-foreground">{MODE_CONFIG[flightMode].maxAlt} m</span></div>
                <div className="flex justify-between"><span>Expo</span><span className="font-mono text-foreground">{(MODE_CONFIG[flightMode].expo * 100).toFixed(0)}%</span></div>
              </div>
            </CardContent>
          </Card>

          {/* C. Virtual Joystick Panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Controls
                <button
                  onClick={() => setKeyboardMode((v) => !v)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-normal transition-colors ${
                    keyboardMode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {keyboardMode ? "⌨ KB Active" : "⌨ KB Off"}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around items-start py-4 gap-4">
                <div className="flex flex-col items-center gap-3">
                  <VirtualJoystick
                    label="T / Y"
                    size="lg"
                    expo={MODE_CONFIG[flightMode].expo}
                    onMove={(x, y) => setLeftJoystick({ x, y })}
                  />
                  <div className="grid grid-cols-2 gap-2 w-full text-center text-[11px]">
                    <div>
                      <div className="text-muted-foreground">Throttle</div>
                      <div className="font-mono text-xs">{(leftJoystick.y * 100).toFixed(0)}%</div>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.abs(leftJoystick.y) * 50 + 50}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Yaw</div>
                      <div className="font-mono text-xs">{(leftJoystick.x * 100).toFixed(0)}%</div>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.abs(leftJoystick.x) * 50 + 50}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <VirtualJoystick
                    label="P / R"
                    size="lg"
                    expo={MODE_CONFIG[flightMode].expo}
                    onMove={(x, y) => setRightJoystick({ x, y })}
                  />
                  <div className="grid grid-cols-2 gap-2 w-full text-center text-[11px]">
                    <div>
                      <div className="text-muted-foreground">Pitch</div>
                      <div className="font-mono text-xs">{(rightJoystick.y * 100).toFixed(0)}%</div>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.abs(rightJoystick.y) * 50 + 50}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Roll</div>
                      <div className="font-mono text-xs">{(rightJoystick.x * 100).toFixed(0)}%</div>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.abs(rightJoystick.x) * 50 + 50}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyboard visualization */}
              {keyboardMode && (
                <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border text-[10px] text-muted-foreground">
                  <div className="flex justify-center gap-3 mb-1">
                    <span><kbd className="px-1 rounded bg-muted">W</kbd> Throttle ↑</span>
                    <span><kbd className="px-1 rounded bg-muted">S</kbd> Throttle ↓</span>
                  </div>
                  <div className="flex justify-center gap-3 mb-1">
                    <span><kbd className="px-1 rounded bg-muted">A</kbd>/<kbd className="px-1 rounded bg-muted">D</kbd> Yaw</span>
                    <span><kbd className="px-1 rounded bg-muted">↑↓←→</kbd> Pitch/Roll</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <span><kbd className="px-1 rounded bg-muted">Space</kbd> Arm</span>
                    <span><kbd className="px-1 rounded bg-muted">Esc</kbd> E-Stop</span>
                    <span><kbd className="px-1 rounded bg-muted">H</kbd> Hover</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* D. Quick Commands */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Arm / Disarm */}
              <Button
                className={`w-full h-12 font-semibold ${isArmed ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
                onClick={() => requestAction(isArmed ? "disarm" : "arm")}
              >
                {isArmed ? <><Square className="h-4 w-4 mr-2" />Disarm</> : <><Power className="h-4 w-4 mr-2" />Arm</>}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-10 bg-transparent text-xs" onClick={() => requestAction("takeoff")} disabled={!isArmed}>
                  <ArrowUp className="h-3 w-3 mr-1" />Takeoff
                </Button>
                <Button variant="outline" className="h-10 bg-transparent text-xs" onClick={() => requestAction("land")}>
                  <ArrowDown className="h-3 w-3 mr-1" />Land
                </Button>
                <Button variant="outline" className="h-10 bg-transparent text-xs" onClick={() => requestAction("rtl")}>
                  <Home className="h-3 w-3 mr-1" />RTH
                </Button>
                <Button
                  variant="outline"
                  className={`h-10 text-xs ${hoverHold ? "border-primary bg-primary/10 text-primary" : "bg-transparent"}`}
                  onClick={() => setHoverHold((v) => !v)}
                  disabled={!isArmed}
                >
                  <Pause className="h-3 w-3 mr-1" />{hoverHold ? "Hovering" : "Hover"}
                </Button>
              </div>

              {/* Emergency STOP */}
              <Button
                className="w-full h-12 bg-red-700 hover:bg-red-800 text-white font-bold text-sm border-2 border-red-500"
                onClick={() => requestAction("stop")}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                EMERGENCY STOP
              </Button>

              {/* Wind info if available */}
              {drone?.windSpeed != null && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Wind className="h-3 w-3" />
                  <span>Wind {drone.windSpeed.toFixed(1)} m/s @ {drone.windDir?.toFixed(0)}°</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* E. Camera & Gimbal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Camera & Gimbal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Gimbal Pitch</Label>
                  <span className="font-mono text-muted-foreground">{gimbalPitch[0]}°</span>
                </div>
                <Slider value={gimbalPitch} onValueChange={setGimbalPitch} min={-90} max={30} step={1} disabled={!isArmed} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Gimbal Yaw</Label>
                  <span className="font-mono text-muted-foreground">{gimbalYaw[0]}°</span>
                </div>
                <Slider value={gimbalYaw} onValueChange={setGimbalYaw} min={-180} max={180} step={1} disabled={!isArmed} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Zoom</Label>
                  <span className="font-mono text-muted-foreground">{zoom[0]}x</span>
                </div>
                <Slider value={zoom} onValueChange={setZoom} min={1} max={10} step={0.5} disabled={!isArmed} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="bg-transparent" disabled={!isArmed} size="sm">
                <Camera className="h-3.5 w-3.5 mr-1.5" />Photo
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                className={isRecording ? "" : "bg-transparent"}
                disabled={!isArmed}
                size="sm"
                onClick={() => setIsRecording((v) => !v)}
              >
                <Video className="h-3.5 w-3.5 mr-1.5" />
                {isRecording ? "Stop Recording" : "Record"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* F. Flight Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Max Speed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Slider value={maxSpeed} onValueChange={setMaxSpeed} max={MODE_CONFIG[flightMode].maxSpeed} step={1} />
              <div className="text-xs font-mono text-right text-muted-foreground">{maxSpeed[0]} m/s</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Max Altitude</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Slider value={maxAltitude} onValueChange={setMaxAltitude} max={MODE_CONFIG[flightMode].maxAlt} step={5} />
              <div className="text-xs font-mono text-right text-muted-foreground">{maxAltitude[0]} m</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">RTH Altitude</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Slider value={rthAltitude} onValueChange={setRthAltitude} max={150} step={5} />
              <div className="text-xs font-mono text-right text-muted-foreground">{rthAltitude[0]} m</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm action dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {pendingAction === "arm" && "Arm the drone — motors will be enabled. Ensure area is clear."}
              {pendingAction === "disarm" && "Disarm the drone — motors will be disabled immediately."}
              {pendingAction === "takeoff" && "Initiate autonomous takeoff. Ensure safety checks are complete."}
              {pendingAction === "land" && "Initiate landing at current location."}
              {pendingAction === "rtl" && "Return-to-Home: drone will navigate back to the home position."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={runAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
