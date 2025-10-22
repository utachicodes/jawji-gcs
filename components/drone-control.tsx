"use client"

import { useState } from "react"
import { useEffect } from "react"
import { toast } from "sonner"
import { useGamepad } from "@/hooks/use-gamepad"
import {
  Play,
  Square,
  Home,
  ArrowUp,
  ArrowDown,
  RotateCw,
  RotateCcw,
  Camera,
  Video,
  Zap,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function DroneControl() {
  const [isArmed, setIsArmed] = useState(false)
  const [throttle, setThrottle] = useState([50])
  const [yaw, setYaw] = useState([0])
  const [leftJoystick, setLeftJoystick] = useState({ x: 0, y: 0 })
  const [rightJoystick, setRightJoystick] = useState({ x: 0, y: 0 })
  const gp = useGamepad(true)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<null | "arm" | "disarm" | "takeoff" | "land" | "rtl">(null)

  useEffect(() => {
    setLeftJoystick({ x: gp.left.x, y: -gp.left.y })
    setRightJoystick({ x: gp.right.x, y: -gp.right.y })
    const t = Math.round(((1 - (gp.left.y + 1) / 2) * 100))
    const yv = Math.round(gp.left.x * 100)
    setThrottle([Math.max(0, Math.min(100, t))])
    setYaw([Math.max(-100, Math.min(100, yv))])
  }, [gp.left.x, gp.left.y, gp.right.x, gp.right.y])

  const requestAction = (action: typeof pendingAction) => {
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const runAction = () => {
    if (!pendingAction) return
    switch (pendingAction) {
      case "arm":
        setIsArmed(true)
        toast.success("Drone armed")
        break
      case "disarm":
        setIsArmed(false)
        toast("Drone disarmed")
        break
      case "takeoff":
        if (!isArmed) {
          toast.error("Arm the drone before takeoff")
          break
        }
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

  return (
    <>
    <div className="h-full p-6 space-y-6 overflow-auto">
      {/* Control Mode Banner */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isArmed ? "bg-red-500/20" : "bg-muted"
            }`}
          >
            <Zap className={`h-5 w-5 ${isArmed ? "text-red-500" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="font-semibold">Manual Control Mode</h3>
            <p className="text-sm text-muted-foreground">
              {isArmed ? "Drone Armed - Ready for Flight" : "Drone Disarmed"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isArmed ? "destructive" : "outline"}>{isArmed ? "ARMED" : "DISARMED"}</Badge>
        </div>
      </div>

      {!isArmed && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Arm the drone before attempting manual control. Ensure all pre-flight checks are complete.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Joysticks */}
        <Card>
          <CardHeader>
            <CardTitle>Virtual Joysticks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around items-center py-8 gap-10">
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm text-muted-foreground">Throttle / Yaw</div>
                <VirtualJoystick
                  onMove={(x, y) => {
                    setLeftJoystick({ x, y })
                    console.log("[JAWJI] Left joystick:", { x, y })
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm text-muted-foreground">Pitch / Roll</div>
                <VirtualJoystick
                  onMove={(x, y) => {
                    setRightJoystick({ x, y })
                    console.log("[JAWJI] Right joystick:", { x, y })
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">Throttle</div>
                <div className="font-mono">{(leftJoystick.y * 100).toFixed(0)}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Yaw</div>
                <div className="font-mono">{(leftJoystick.x * 100).toFixed(0)}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Pitch</div>
                <div className="font-mono">{(rightJoystick.y * 100).toFixed(0)}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Roll</div>
                <div className="font-mono">{(rightJoystick.x * 100).toFixed(0)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={isArmed ? "destructive" : "default"}
                className="h-16"
                onClick={() => requestAction(isArmed ? "disarm" : "arm")}
              >
                {isArmed ? (
                  <>
                    <Square className="h-5 w-5 mr-2" />
                    Disarm
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Arm
                  </>
                )}
              </Button>
              <Button variant="outline" className="h-16 bg-transparent" onClick={() => requestAction("rtl")}>
                <Home className="h-5 w-5 mr-2" />
                Return Home
              </Button>
              <Button variant="outline" className="h-16 bg-transparent" onClick={() => requestAction("takeoff")}>
                <ArrowUp className="h-5 w-5 mr-2" />
                Takeoff
              </Button>
              <Button variant="outline" className="h-16 bg-transparent" onClick={() => requestAction("land")}>
                <ArrowDown className="h-5 w-5 mr-2" />
                Land
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Altitude Control</Label>
              <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" disabled={!isArmed}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Slider value={throttle} onValueChange={setThrottle} max={100} className="flex-1" disabled={!isArmed} />
                <Button size="icon" variant="outline" disabled={!isArmed}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center">Throttle: {throttle[0]}%</div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Yaw Control</Label>
              <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" disabled={!isArmed}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Slider
                  value={yaw}
                  onValueChange={setYaw}
                  min={-100}
                  max={100}
                  className="flex-1"
                  disabled={!isArmed}
                />
                <Button size="icon" variant="outline" disabled={!isArmed}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center">Yaw: {yaw[0]}°</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera & Gimbal Control */}
      <Card>
        <CardHeader>
          <CardTitle>Camera & Gimbal Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <Label>Gimbal Pitch</Label>
              <Slider defaultValue={[0]} min={-90} max={30} disabled={!isArmed} />
            </div>
            <div className="space-y-3">
              <Label>Gimbal Yaw</Label>
              <Slider defaultValue={[0]} min={-180} max={180} disabled={!isArmed} />
            </div>
            <div className="space-y-3">
              <Label>Zoom</Label>
              <Slider defaultValue={[1]} min={1} max={10} disabled={!isArmed} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" disabled={!isArmed}>
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
            <Button variant="outline" disabled={!isArmed}>
              <Video className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flight Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Max Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <Slider defaultValue={[10]} max={20} step={1} />
            <p className="text-xs text-muted-foreground mt-2">10 m/s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Max Altitude</CardTitle>
          </CardHeader>
          <CardContent>
            <Slider defaultValue={[100]} max={200} step={5} />
            <p className="text-xs text-muted-foreground mt-2">100 m</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Return Home Altitude</CardTitle>
          </CardHeader>
          <CardContent>
            <Slider defaultValue={[50]} max={150} step={5} />
            <p className="text-xs text-muted-foreground mt-2">50 m</p>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Confirm action dialog */}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>
            {pendingAction === "arm" && "Arm the drone and enable motors."}
            {pendingAction === "disarm" && "Disarm the drone. Motors will be disabled."}
            {pendingAction === "takeoff" && "Initiate autonomous takeoff. Ensure safety checks are complete."}
            {pendingAction === "land" && "Initiate landing at current location."}
            {pendingAction === "rtl" && "Return to home. The drone will navigate back to the home position."}
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
