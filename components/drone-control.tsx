"use client"

import { useState } from "react"
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

export function DroneControl() {
  const [isArmed, setIsArmed] = useState(false)
  const [throttle, setThrottle] = useState([50])
  const [yaw, setYaw] = useState([0])
  const [leftJoystick, setLeftJoystick] = useState({ x: 0, y: 0 })
  const [rightJoystick, setRightJoystick] = useState({ x: 0, y: 0 })

  return (
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
            <div className="flex justify-around items-center py-8">
              <VirtualJoystick
                label="Throttle / Yaw"
                onMove={(x, y) => {
                  setLeftJoystick({ x, y })
                  console.log("[v0] Left joystick:", { x, y })
                }}
              />
              <VirtualJoystick
                label="Pitch / Roll"
                onMove={(x, y) => {
                  setRightJoystick({ x, y })
                  console.log("[v0] Right joystick:", { x, y })
                }}
              />
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
                onClick={() => setIsArmed(!isArmed)}
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
              <Button variant="outline" className="h-16 bg-transparent" disabled={!isArmed}>
                <Home className="h-5 w-5 mr-2" />
                Return Home
              </Button>
              <Button variant="outline" className="h-16 bg-transparent" disabled={!isArmed}>
                <ArrowUp className="h-5 w-5 mr-2" />
                Takeoff
              </Button>
              <Button variant="outline" className="h-16 bg-transparent" disabled={!isArmed}>
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
  )
}
