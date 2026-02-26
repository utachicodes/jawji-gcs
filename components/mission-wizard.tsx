"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useMissionStore, type MissionType, type MissionPackage } from "@/lib/mission-store"
import { useDroneStore } from "@/lib/drone-store"
import { useKioskStore, type Kiosk } from "@/lib/kiosk-store"
import { MISSION_PACKAGES } from "@/lib/mission-templates"
import { z } from "zod"
import { MapGeofence } from "@/components/map-geofence"
import { Package, Map, Camera, Settings, Shield, CheckCircle2, Truck, MapPin, X } from "lucide-react"

// ── Icon helpers ──────────────────────────────────────────────────────────────

const TYPE_META: Record<MissionType, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  delivery:   { label: "Delivery",   description: "Autonomous package delivery with kiosk stops",   icon: <Truck className="h-6 w-6" />,   color: "border-blue-500 bg-blue-500/10 text-blue-400" },
  survey:     { label: "Survey",     description: "Aerial survey with grid or custom coverage patterns", icon: <Map className="h-6 w-6" />,     color: "border-green-500 bg-green-500/10 text-green-400" },
  inspection: { label: "Inspection", description: "Point-based inspection with camera control",      icon: <Camera className="h-6 w-6" />,   color: "border-orange-500 bg-orange-500/10 text-orange-400" },
  custom:     { label: "Custom",     description: "Freeform mission planning",                        icon: <Settings className="h-6 w-6" />, color: "border-purple-500 bg-purple-500/10 text-purple-400" },
}

const CATEGORY_COLORS: Record<string, string> = {
  medical:   "bg-red-500/20 text-red-300 border-red-500/30",
  warehouse: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  campus:    "bg-green-500/20 text-green-300 border-green-500/30",
  urban:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  field:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const basicsSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
})
const vehicleSchema = z.object({
  droneId: z.string().min(1, "Select a drone"),
})

// ── Component ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Type" },
  { id: 2, title: "Basics" },
  { id: 3, title: "Vehicle" },
  { id: 4, title: "Settings" },
  { id: 5, title: "Packages" },
  { id: 6, title: "Safety" },
  { id: 7, title: "Review" },
]

export function MissionWizard() {
  const router = useRouter()
  const { drones } = useDroneStore()
  const addMission = useMissionStore((s) => s.addMission)
  const kiosks = useKioskStore((s) => s.kiosks)
  const activeKiosks = kiosks.filter((k) => k.status === "active")

  // Step
  const [step, setStep] = useState(1)

  // Step 1 – Type
  const [missionType, setMissionType] = useState<MissionType | null>(null)

  // Step 2 – Basics
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Step 3 – Vehicle
  const [droneId, setDroneId] = useState<string | undefined>(undefined)
  const [payload, setPayload] = useState("")

  // Step 4 – Type Settings: Delivery
  const [pickupKioskId, setPickupKioskId] = useState<string | undefined>()
  const [dropoffKioskId, setDropoffKioskId] = useState<string | undefined>()
  const [payloadWeight, setPayloadWeight] = useState<number>(1)
  const [payloadFragile, setPayloadFragile] = useState(false)
  const [payloadDesc, setPayloadDesc] = useState("")
  const [dropMethod, setDropMethod] = useState<"winch" | "land" | "release">("land")

  // Step 4 – Type Settings: Survey
  const [surveyAltitude, setSurveyAltitude] = useState(50)
  const [surveyOverlap, setSurveyOverlap] = useState(70)
  const [scanPattern, setScanPattern] = useState<"grid" | "circular" | "custom">("grid")
  const [captureInterval, setCaptureInterval] = useState(2)

  // Step 4 – Type Settings: Inspection
  const [inspectionZoom, setInspectionZoom] = useState(1)
  const [inspectionGimbal, setInspectionGimbal] = useState(-45)
  const [inspectionCaptureMode, setInspectionCaptureMode] = useState<"photo" | "video" | "both">("photo")
  const [customNotes, setCustomNotes] = useState("")

  // Step 5 – Packages
  const [selectedPackages, setSelectedPackages] = useState<MissionPackage[]>([])

  // Step 6 – Safety
  const [geofence, setGeofence] = useState("")
  const [startTime, setStartTime] = useState("")
  const [altitude, setAltitude] = useState<number>(120)
  const [speed, setSpeed] = useState<number>(12)
  const [riskAssessment, setRiskAssessment] = useState("")
  const [checklist, setChecklist] = useState<string[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Helpers ────────────────────────────────────────────────────────────────

  const basicValid = basicsSchema.safeParse({ name: name.trim(), description: description.trim() }).success
  const vehicleValid = vehicleSchema.safeParse({ droneId: droneId || "" }).success

  const validateStep = (): boolean => {
    if (step === 1 && !missionType) {
      setErrors({ type: "Select a mission type to continue" })
      return false
    }
    if (step === 2) {
      const res = basicsSchema.safeParse({ name: name.trim(), description: description.trim() })
      if (!res.success) {
        const e: Record<string, string> = {}
        res.error.issues.forEach((i) => (e[i.path[0] as string] = i.message))
        setErrors(e); return false
      }
    }
    if (step === 3) {
      const res = vehicleSchema.safeParse({ droneId: droneId || "" })
      if (!res.success) {
        const e: Record<string, string> = {}
        res.error.issues.forEach((i) => (e[i.path[0] as string] = i.message))
        setErrors(e); return false
      }
    }
    setErrors({})
    return true
  }

  const canNext = () => {
    if (step === 1) return !!missionType
    if (step === 2) return basicValid
    if (step === 3) return vehicleValid
    return true
  }

  const togglePackage = (pkg: MissionPackage) => {
    setSelectedPackages((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    )
  }

  const findKiosk = (id?: string) => activeKiosks.find((k) => k.id === id)

  const onSubmit = () => {
    const pickupKiosk = findKiosk(pickupKioskId)
    const dropoffKiosk = findKiosk(dropoffKioskId)

    const mission = addMission({
      name: name.trim(),
      description: description.trim(),
      waypoints: 0,
      distance: 0,
      duration: 0,
      status: "draft",
      missionType: missionType ?? "custom",
      packages: selectedPackages,
      droneId,
      payload,
      altitude,
      cruiseSpeed: speed,
      geofence,
      startTime,
      riskAssessment,
      checklist,
      ...(missionType === "delivery" && pickupKiosk && dropoffKiosk ? {
        deliveryDetails: {
          pickupLocation: { lat: pickupKiosk.location.lat, lng: pickupKiosk.location.lng, kioskId: pickupKioskId },
          dropoffLocation: { lat: dropoffKiosk.location.lat, lng: dropoffKiosk.location.lng, kioskId: dropoffKioskId },
          payload: { weight: payloadWeight, fragile: payloadFragile, description: payloadDesc },
          dropParameters: { altitude: 5, dropMethod, confirmationRequired: true },
        },
      } : {}),
      ...(missionType === "survey" ? {
        surveyDetails: {
          coverageArea: geofence,
          altitude: surveyAltitude,
          overlapPercentage: surveyOverlap,
          scanPattern,
          captureInterval,
        },
      } : {}),
      ...(missionType === "inspection" ? {
        inspectionDetails: {
          inspectionPoints: [],
          cameraSettings: { zoom: inspectionZoom, gimbalPitch: inspectionGimbal, captureMode: inspectionCaptureMode },
        },
      } : {}),
    })
    router.push("/missions")
  }

  // ── Kiosk card ─────────────────────────────────────────────────────────────

  const KioskCard = ({ kiosk, selected, label, onSelect }: { kiosk: Kiosk; selected: boolean; label: string; onSelect: () => void }) => {
    const pct = (kiosk.capacity.currentLoad / kiosk.capacity.maxWeight) * 100
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left p-3 rounded-lg border transition-all ${selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{kiosk.name}</span>
              <Badge className={`text-[10px] h-4 px-1.5 border ${CATEGORY_COLORS[kiosk.category] ?? ""}`}>
                {kiosk.category}
              </Badge>
              {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </div>
            {kiosk.metadata?.address && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{kiosk.metadata.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {kiosk.features.cooling && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">❄ Cool</span>}
              {kiosk.features.heated && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">🔥 Heat</span>}
              {kiosk.features.secure && <span className="text-[10px] bg-zinc-500/10 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-500/20">🔒 Secure</span>}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="text-[10px] font-mono mt-0.5">{kiosk.capacity.currentLoad}/{kiosk.capacity.maxWeight} kg</div>
            <div className="mt-1 w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </button>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header + Progress */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Mission Planning</h1>
          <p className="text-muted-foreground text-sm">Define mission parameters and validate before execution</p>
        </div>
        {/* Step bar */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`px-2 py-1 rounded border transition-colors ${
                step === s.id ? "border-primary bg-primary/10 text-primary font-semibold" :
                step > s.id ? "border-green-500/50 bg-green-500/10 text-green-400" :
                "border-border text-muted-foreground"
              }`}>
                {step > s.id ? "✓" : s.id}. {s.title}
              </div>
              {i < STEPS.length - 1 && <div className={`w-4 h-px ${step > s.id ? "bg-green-500/50" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Type ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Mission Type</CardTitle>
            <CardDescription>Select the type of mission you want to plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(TYPE_META) as MissionType[]).map((t) => {
                const meta = TYPE_META[t]
                const active = missionType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMissionType(t)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${active ? meta.color + " ring-1 ring-current" : "border-border hover:border-primary/40"}`}
                  >
                    <div className={`mb-2 ${active ? "" : "text-muted-foreground"}`}>{meta.icon}</div>
                    <div className={`font-semibold text-sm ${active ? "" : "text-foreground"}`}>{meta.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{meta.description}</div>
                  </button>
                )
              })}
            </div>
            {errors.type && <p className="text-xs text-destructive mt-2">{errors.type}</p>}
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Basics ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Mission Basics</CardTitle>
            <CardDescription>Name and describe your mission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mission Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Warehouse Inventory Sweep" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose, area, outcomes" rows={3} />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Vehicle & Payload ── */}
      {step === 3 && (
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
                  {drones.length === 0 ? (
                    <SelectItem value="__none" disabled>No drones registered</SelectItem>
                  ) : (
                    drones.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name} · {d.model.toUpperCase()}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.droneId && <p className="text-xs text-destructive">{errors.droneId}</p>}
            </div>
            <div className="space-y-2">
              <Label>Payload</Label>
              <Input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="e.g., 4K Camera, Thermal Sensor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cruise Altitude (m)</Label>
                <Input type="number" value={altitude} onChange={(e) => setAltitude(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Cruise Speed (m/s)</Label>
                <Input type="number" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Type Settings ── */}
      {step === 4 && missionType === "delivery" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
              <CardDescription>Configure kiosks and payload for your delivery mission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Kiosk grid grouped by category */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Pickup Kiosk</Label>
                <div className="space-y-2 max-h-52 overflow-y-auto rounded-lg border border-border p-2">
                  {activeKiosks.map((k) => (
                    <KioskCard key={k.id} kiosk={k} selected={pickupKioskId === k.id} label="PICKUP" onSelect={() => setPickupKioskId((prev) => prev === k.id ? undefined : k.id)} />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Drop-off Kiosk</Label>
                <div className="space-y-2 max-h-52 overflow-y-auto rounded-lg border border-border p-2">
                  {activeKiosks.map((k) => (
                    <KioskCard key={k.id} kiosk={k} selected={dropoffKioskId === k.id} label="DROP" onSelect={() => setDropoffKioskId((prev) => prev === k.id ? undefined : k.id)} />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payload Weight (kg)</Label>
                  <Input type="number" value={payloadWeight} min={0.1} max={25} step={0.1} onChange={(e) => setPayloadWeight(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Drop Method</Label>
                  <Select value={dropMethod} onValueChange={(v) => setDropMethod(v as typeof dropMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="winch">Winch</SelectItem>
                      <SelectItem value="release">Release</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="fragile" checked={payloadFragile} onChange={(e) => setPayloadFragile(e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="fragile" className="cursor-pointer">Fragile payload</Label>
              </div>
              <div className="space-y-2">
                <Label>Payload Description</Label>
                <Input value={payloadDesc} onChange={(e) => setPayloadDesc(e.target.value)} placeholder="e.g., Medical supplies, Refrigerated samples" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && missionType === "survey" && (
        <Card>
          <CardHeader>
            <CardTitle>Survey Settings</CardTitle>
            <CardDescription>Configure coverage parameters for aerial survey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Survey Altitude (m)</Label>
                <Input type="number" value={surveyAltitude} min={20} max={150} onChange={(e) => setSurveyAltitude(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Overlap (%)</Label>
                <Input type="number" value={surveyOverlap} min={30} max={90} onChange={(e) => setSurveyOverlap(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Scan Pattern</Label>
                <Select value={scanPattern} onValueChange={(v) => setScanPattern(v as typeof scanPattern)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capture Interval (s)</Label>
                <Input type="number" value={captureInterval} min={0.5} max={10} step={0.5} onChange={(e) => setCaptureInterval(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && missionType === "inspection" && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection Settings</CardTitle>
            <CardDescription>Configure camera and inspection parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Zoom (1-10x)</Label>
                <Input type="number" value={inspectionZoom} min={1} max={10} step={0.5} onChange={(e) => setInspectionZoom(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Gimbal Pitch (°)</Label>
                <Input type="number" value={inspectionGimbal} min={-90} max={30} onChange={(e) => setInspectionGimbal(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Capture Mode</Label>
                <Select value={inspectionCaptureMode} onValueChange={(v) => setInspectionCaptureMode(v as typeof inspectionCaptureMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Inspection points can be added on the mission planning map after saving.</p>
          </CardContent>
        </Card>
      )}

      {step === 4 && missionType === "custom" && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Mission Notes</CardTitle>
            <CardDescription>Describe any special requirements for this mission</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="Special instructions, custom sensor config, unique flight patterns..." rows={6} />
          </CardContent>
        </Card>
      )}

      {/* ── Step 5: Packages ── */}
      {step === 5 && missionType && (
        <Card>
          <CardHeader>
            <CardTitle>Capability Packages</CardTitle>
            <CardDescription>Select the packages to enable for this {TYPE_META[missionType].label.toLowerCase()} mission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MISSION_PACKAGES[missionType].map(({ package: pkg, label, description, icon }) => {
                const active = selectedPackages.includes(pkg)
                return (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => togglePackage(pkg)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-lg ${active ? "bg-primary/20" : "bg-muted"}`}>
                      <Shield className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{label}</span>
                        {active && <Badge className="text-[10px] h-4 px-1.5 bg-primary/20 text-primary border-primary/30">Enabled</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedPackages.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {selectedPackages.map((pkg) => (
                  <button key={pkg} type="button" onClick={() => togglePackage(pkg)} className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                    {pkg.replace(/_/g, " ")}
                    <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 6: Safety & Compliance ── */}
      {step === 6 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety & Compliance</CardTitle>
              <CardDescription>Risk assessment, geofence, and pre-flight checklist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Risk Assessment</Label>
                <Textarea value={riskAssessment} onChange={(e) => setRiskAssessment(e.target.value)} placeholder="Weather, NOTAMs, restricted airspace, crew briefing..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Pre-flight Checklist (comma separated)</Label>
                <Input
                  placeholder="Batteries charged, Props secured, Sensors calibrated"
                  onChange={(e) => setChecklist(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>
              <div className="space-y-2">
                <Label>Geofence</Label>
                <MapGeofence value={geofence} onChange={setGeofence} />
              </div>
              <div className="space-y-2">
                <Label>Planned Start Time</Label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 7: Review ── */}
      {step === 7 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Mission</CardTitle>
            <CardDescription>Verify all details before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Type:</span>
              <Badge className={missionType ? TYPE_META[missionType].color + " border" : ""}>{missionType ? TYPE_META[missionType].label : "—"}</Badge>
            </div>
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{name}</span></div>
            <div><span className="text-muted-foreground">Description:</span> <span className="font-medium">{description}</span></div>
            <div><span className="text-muted-foreground">Drone:</span> <span className="font-medium">{drones.find((d) => d.id === droneId)?.name || "—"}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Altitude:</span> <span className="font-medium">{altitude} m</span></div>
              <div><span className="text-muted-foreground">Speed:</span> <span className="font-medium">{speed} m/s</span></div>
            </div>

            {missionType === "delivery" && (
              <div className="space-y-1 pt-1 border-t border-border">
                <div><span className="text-muted-foreground">Pickup:</span> <span className="font-medium">{findKiosk(pickupKioskId)?.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Drop-off:</span> <span className="font-medium">{findKiosk(dropoffKioskId)?.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Payload:</span> <span className="font-medium">{payloadWeight} kg {payloadFragile ? "· Fragile" : ""}</span></div>
                <div><span className="text-muted-foreground">Drop Method:</span> <span className="font-medium capitalize">{dropMethod}</span></div>
              </div>
            )}

            {missionType === "survey" && (
              <div className="space-y-1 pt-1 border-t border-border">
                <div><span className="text-muted-foreground">Survey Alt:</span> <span className="font-medium">{surveyAltitude} m</span></div>
                <div><span className="text-muted-foreground">Overlap:</span> <span className="font-medium">{surveyOverlap}%</span></div>
                <div><span className="text-muted-foreground">Pattern:</span> <span className="font-medium capitalize">{scanPattern}</span></div>
              </div>
            )}

            {selectedPackages.length > 0 && (
              <div className="pt-1 border-t border-border space-y-1">
                <span className="text-muted-foreground">Packages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPackages.map((pkg) => (
                    <Badge key={pkg} variant="outline" className="text-[10px]">{pkg.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-1 border-t border-border">
              <div><span className="text-muted-foreground">Start:</span> <span className="font-medium">{startTime || "—"}</span></div>
              <div><span className="text-muted-foreground">Checklist:</span> <span className="font-medium">{checklist.join(", ") || "—"}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="bg-transparent" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          Back
        </Button>
        <div className="flex gap-2">
          {step < STEPS.length && (
            <Button
              onClick={() => { if (validateStep()) setStep((s) => Math.min(STEPS.length, s + 1)) }}
              disabled={!canNext()}
            >
              Next
            </Button>
          )}
          {step === STEPS.length && (
            <Button onClick={onSubmit} className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
              Save Mission
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
