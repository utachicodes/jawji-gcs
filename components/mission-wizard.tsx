"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useMissionStore } from "@/lib/mission-store"
import { useDroneStore } from "@/lib/drone-store"
import { z } from "zod"
import { MapGeofence } from "@/components/map-geofence"

export function MissionWizard() {
  const router = useRouter()
  const { drones } = useDroneStore()
  const addMission = useMissionStore((s) => s.addMission)

  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [droneId, setDroneId] = useState<string | undefined>(undefined)
  const [payload, setPayload] = useState("")
  const [altitude, setAltitude] = useState<number | undefined>(120)
  const [speed, setSpeed] = useState<number | undefined>(12)
  const [geofence, setGeofence] = useState("")
  const [startTime, setStartTime] = useState("")
  const [riskAssessment, setRiskAssessment] = useState("")
  const [checklist, setChecklist] = useState<string[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const basicsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(5, "Description is required"),
  })
  const vehicleSchema = z.object({
    droneId: z.string().min(1, "Select a drone"),
  })
  const profileSchema = z.object({
    altitude: z.number().positive("Altitude must be > 0"),
    speed: z.number().positive("Speed must be > 0"),
  })

  const steps = [
    { id: 1, title: "Basics" },
    { id: 2, title: "Vehicle & Payload" },
    { id: 3, title: "Flight Profile" },
    { id: 4, title: "Safety & Compliance" },
    { id: 5, title: "Review" },
  ]

  const validateBasics = () => {
    const res = basicsSchema.safeParse({ name: name.trim(), description: description.trim() })
    const next: Record<string, string> = {}
    if (!res.success) res.error.issues.forEach((i) => (next[i.path[0] as string] = i.message))
    setErrors((e) => ({ ...e, ...next }))
    return res.success
  }
  const validateVehicle = () => {
    const res = vehicleSchema.safeParse({ droneId: droneId || "" })
    const next: Record<string, string> = {}
    if (!res.success) res.error.issues.forEach((i) => (next[i.path[0] as string] = i.message))
    setErrors((e) => ({ ...e, ...next }))
    return res.success
  }
  const validateProfile = () => {
    const res = profileSchema.safeParse({ altitude: Number(altitude), speed: Number(speed) })
    const next: Record<string, string> = {}
    if (!res.success) res.error.issues.forEach((i) => (next[i.path[0] as string] = i.message))
    setErrors((e) => ({ ...e, ...next }))
    return res.success
  }

  // Pure validity checks (no state updates) to control disabled state
  const basicValid = basicsSchema.safeParse({ name: name.trim(), description: description.trim() }).success
  const vehicleValid = vehicleSchema.safeParse({ droneId: droneId || "" }).success
  const profileValid = profileSchema.safeParse({ altitude: Number(altitude), speed: Number(speed) }).success

  const onSubmit = () => {
    const mission = addMission({
      name: name.trim(),
      description: description.trim(),
      waypoints: 0,
      distance: 0,
      duration: 0,
      status: "draft",
      droneId,
      payload,
      altitude,
      cruiseSpeed: speed,
      geofence,
      startTime,
      riskAssessment,
      checklist,
    })
    router.push("/missions")
  }

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mission Planning</h1>
          <p className="text-muted-foreground">Define mission parameters and validate before execution</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            {steps.map((s, i) => (
              <div key={s.id} className={`px-2 py-1 rounded border ${step === s.id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                {i + 1}. {s.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Mission name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mission Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Warehouse Inventory Sweep" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose, area, outcomes" />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Payload</CardTitle>
            <CardDescription>Select the drone and payload configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Drone</Label>
              <Select value={droneId} onValueChange={setDroneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a drone" />
                </SelectTrigger>
                <SelectContent>
                  {drones.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} · {d.model.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.droneId && <p className="text-xs text-destructive">{errors.droneId}</p>}
            <div className="space-y-2">
              <Label>Payload</Label>
              <Input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="e.g., 4K Camera, Thermal" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Flight Profile</CardTitle>
            <CardDescription>Basic flight parameters and geofence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Altitude (m)</Label>
                <Input type="number" value={altitude ?? ""} onChange={(e) => setAltitude(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Cruise Speed (m/s)</Label>
                <Input type="number" value={speed ?? ""} onChange={(e) => setSpeed(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Geofence</Label>
              <MapGeofence value={geofence} onChange={setGeofence} />
            </div>
            <div className="space-y-2">
              <Label>Planned Start Time</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            {(errors.altitude || errors.speed) && (
              <p className="text-xs text-destructive">{errors.altitude || errors.speed}</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Safety & Compliance</CardTitle>
            <CardDescription>Risk, checklists and compliance notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Risk Assessment</Label>
              <Textarea value={riskAssessment} onChange={(e) => setRiskAssessment(e.target.value)} placeholder="Weather, area risks, NOTAMs, crew" />
            </div>
            <div className="space-y-2">
              <Label>Pre-flight Checklist (comma separated)</Label>
              <Input
                placeholder="Batteries charged, Props secured, Sensors calibrated"
                onChange={(e) => setChecklist(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
            <CardDescription>Verify all details before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{name}</span></div>
            <div><span className="text-muted-foreground">Description:</span> <span className="font-medium">{description}</span></div>
            <div><span className="text-muted-foreground">Drone:</span> <span className="font-medium">{drones.find(d=>d.id===droneId)?.name || "—"}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Altitude:</span> <span className="font-medium">{altitude ?? "—"} m</span></div>
              <div><span className="text-muted-foreground">Speed:</span> <span className="font-medium">{speed ?? "—"} m/s</span></div>
            </div>
            <div><span className="text-muted-foreground">Geofence:</span> <span className="font-medium break-words">{geofence || "—"}</span></div>
            <div><span className="text-muted-foreground">Start:</span> <span className="font-medium">{startTime || "—"}</span></div>
            <div><span className="text-muted-foreground">Checklist:</span> <span className="font-medium">{checklist.join(", ") || "—"}</span></div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" className="bg-transparent" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          Back
        </Button>
        <div className="flex gap-2">
          {step < 5 && (
            <Button
              onClick={() => {
                if (step === 1 && !validateBasics()) return
                if (step === 2 && !validateVehicle()) return
                if (step === 3 && !validateProfile()) return
                setStep((s) => Math.min(5, s + 1))
              }}
              disabled={(step === 1 && !basicValid) || (step === 2 && !vehicleValid) || (step === 3 && !profileValid)}
            >
              Next
            </Button>
          )}
          {step === 5 && (
            <Button onClick={onSubmit} className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
              Save Mission
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
