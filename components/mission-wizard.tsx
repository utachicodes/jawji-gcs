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
import { useDroneStore } from "@/lib/drone-store"
import { Shield, Box, CheckCircle2, ChevronRight, Save, X, ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { z } from "zod"
import { MapGeofence } from "@/components/map-geofence"
import { useFirebaseAuth } from "@/lib/auth-service"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export function MissionWizard() {
  const router = useRouter()
  const { drones } = useDroneStore()
  const { user } = useFirebaseAuth()

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
    { id: 1, title: "Identity", desc: "Basic Info" },
    { id: 2, title: "Platform", desc: "Drone & Kit" },
    { id: 3, title: "Parameters", desc: "Flight Profile" },
    { id: 4, title: "Safety", desc: "Risk & Checks" },
    { id: 5, title: "Confirm", desc: "Review" },
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

  const onSubmit = async () => {
    try {
      if (!user) {
        toast.error("You must be logged in to save missions");
        return;
      }
      toast.success("Mission saved to cloud");
      router.push("/missions");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save mission");
    }
  }

  return (
    <div className="h-full w-full relative bg-background overflow-hidden font-sans flex items-center justify-center p-6">

      {/* Background Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Main Wizard Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl h-[85vh] bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden relative"
      >

        {/* Left Panel: Stepper */}
        <div className="w-72 bg-card/60 border-r border-white/5 p-6 flex flex-col justify-between relative z-10">
          <div>
            <div className="mb-10 pl-2">
              <h1 className="font-bold text-2xl tracking-tight flex items-center gap-2">
                <Box className="w-6 h-6 text-primary" />
                NEW OP
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Mission Wizard</p>
            </div>

            <div className="space-y-6 relative">
              {/* Connecting Line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10 -z-10" />

              {steps.map((s, i) => (
                <div key={s.id} className="relative group">
                  <div className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? 'opacity-100 translate-x-1' : step > s.id ? 'opacity-70' : 'opacity-40'}`}>
                    <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-300
                                ${step === s.id ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110' :
                        step > s.id ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-background border-white/20 text-muted-foreground'}
                             `}>
                      {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${step === s.id ? 'text-foreground' : 'text-muted-foreground'}`}>{s.title}</div>
                      <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground/40 pl-2">
            JAWJI GCS v2.0
          </div>
        </div>

        {/* Right Panel: Content Form */}
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-transparent to-primary/5">
          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full max-w-2xl mx-auto"
              >
                {step === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Mission Identity</h2>
                      <p className="text-muted-foreground text-lg">Define the operational scope.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Operation Name</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Sector 7 Surveillance"
                          className="h-14 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all"
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Mission Brief</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Detailed objective description..."
                          className="min-h-[200px] text-base bg-background/50 border-white/10 focus-visible:ring-primary/50 resize-none transition-all"
                        />
                        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Platform Configuration</h2>
                      <p className="text-muted-foreground text-lg">Select aerial vehicle and sensor package.</p>
                    </div>
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Select Drone</Label>
                        <div className="grid grid-cols-1 gap-4">
                          {drones.map(d => (
                            <div
                              key={d.id}
                              onClick={() => setDroneId(d.id)}
                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${droneId === d.id ? 'border-primary bg-primary/10 shadow-lg' : 'border-white/10 bg-background/20 hover:border-white/20'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center">
                                  <Box className="text-foreground/80" />
                                </div>
                                <div>
                                  <div className="font-bold text-lg">{d.name}</div>
                                  <div className="text-xs text-muted-foreground uppercase font-mono">{d.model} • {d.status}</div>
                                </div>
                              </div>
                              {droneId === d.id && <CheckCircle2 className="text-primary w-6 h-6" />}
                            </div>
                          ))}
                        </div>
                        {errors.droneId && <p className="text-xs text-destructive">{errors.droneId}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Payload</Label>
                        <Input
                          value={payload}
                          onChange={(e) => setPayload(e.target.value)}
                          placeholder="e.g., Thermal Camera, Lidar Scanner"
                          className="h-12 bg-background/50 border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Flight Parameters</h2>
                      <p className="text-muted-foreground text-lg">Establish geometric boundaries and limits.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3 p-5 rounded-2xl bg-background/30 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm font-bold uppercase">Cruise Altitude</Label>
                          <span className="font-mono text-xl text-primary">{altitude}m</span>
                        </div>
                        <Input
                          type="number"
                          value={altitude}
                          onChange={(e) => setAltitude(Number(e.target.value))}
                          className="mb-4"
                        />
                        <p className="text-xs text-muted-foreground">AGL (Above Ground Level). Maintain clearance from terrain.</p>
                      </div>
                      <div className="space-y-3 p-5 rounded-2xl bg-background/30 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm font-bold uppercase">Cruise Speed</Label>
                          <span className="font-mono text-xl text-primary">{speed}m/s</span>
                        </div>
                        <Input
                          type="number"
                          value={speed}
                          onChange={(e) => setSpeed(Number(e.target.value))}
                          className="mb-4"
                        />
                        <p className="text-xs text-muted-foreground">Optimal for battery efficiency and sensor coverage.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Geofence (GeoJSON)</Label>
                      <div className="h-64 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                        <MapGeofence value={geofence} onChange={setGeofence} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Safety & Compliance</h2>
                      <p className="text-muted-foreground text-lg">Risk mitigation protocols.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-4">
                        <Shield className="w-6 h-6 text-yellow-500 mt-1 shrink-0" />
                        <div>
                          <h4 className="font-bold text-yellow-500">Compliance Warning</h4>
                          <p className="text-sm text-yellow-500/80 mt-1">Ensure this mission adheres to local aviation authority regulations regarding BVLOS and populated areas.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Risk Assessment</Label>
                        <Textarea
                          value={riskAssessment}
                          onChange={(e) => setRiskAssessment(e.target.value)}
                          placeholder="Identify hazards and mitigation strategies..."
                          className="min-h-[120px] bg-background/50 border-white/10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm uppercase text-muted-foreground font-bold tracking-wider">Pre-flight Checklist</Label>
                        <div className="flex gap-2 mb-4">
                          <Input id="checklist-add" placeholder="Add custom check item..." className="bg-background/50 border-white/10" />
                          <Button variant="secondary" onClick={() => {
                            const el = document.getElementById('checklist-add') as HTMLInputElement
                            if (el.value.trim()) {
                              setChecklist([...checklist, el.value.trim()])
                              el.value = ""
                            }
                          }}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {checklist.map((c, i) => (
                            <Badge key={i} variant="outline" className="pl-3 pr-1 py-1 gap-2 border-white/20">
                              {c}
                              <button onClick={() => setChecklist(prev => prev.filter((_, idx) => idx !== i))} className="hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          {checklist.length === 0 && <span className="text-sm text-muted-foreground italic">No custom items.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Mission Briefing</h2>
                      <p className="text-muted-foreground text-lg">Final review before commitment.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-background/40 border border-white/10 space-y-1">
                        <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Mission Name</div>
                        <div className="text-xl font-bold">{name}</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-background/40 border border-white/10 space-y-1">
                        <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Platform</div>
                        <div className="text-xl font-bold">{drones.find(d => d.id === droneId)?.name || "Unknown"}</div>
                      </div>
                      <div className="col-span-2 p-6 rounded-2xl bg-background/40 border border-white/10 flex justify-between items-center text-center">
                        <div>
                          <div className="text-3xl font-mono">{altitude}m</div>
                          <div className="text-xs uppercase text-muted-foreground">Cruising Alt</div>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                          <div className="text-3xl font-mono">{speed}m/s</div>
                          <div className="text-xs uppercase text-muted-foreground">Cruising Spd</div>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                          <div className="text-3xl font-mono">{checklist.length}</div>
                          <div className="text-xs uppercase text-muted-foreground">Checks</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Footer */}
          <div className="p-6 border-t border-white/5 bg-background/20 backdrop-blur-md flex justify-between items-center">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)} className="hover:bg-white/5">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < 5 ? (
              <Button size="lg" className="px-8 shadow-lg shadow-primary/20" onClick={() => {
                if (step === 1 && !validateBasics()) return
                if (step === 2 && !validateVehicle()) return
                if (step === 3 && !validateProfile()) return
                setStep(s => s + 1)
              }}>
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button size="lg" className="px-8 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20" onClick={onSubmit}>
                <Save className="w-4 h-4 mr-2" /> CREATE MISSION
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
