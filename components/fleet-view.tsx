"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useDroneStore, type Drone } from "@/lib/drone-store"
import { useMissionStore } from "@/lib/mission-store"
import { useAssignmentStore, type Assignment, type AssignmentStatus } from "@/lib/assignment-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Plus, Pencil, Trash2, Upload, Download, CheckCircle2 } from "lucide-react"

export default function FleetView() {
  const { drones, selectedDrone, addDrone, updateDrone, removeDrone, selectDrone } = useDroneStore()
  const missions = useMissionStore((s) => s.missions)
  const { assignments, addAssignment, updateAssignment, removeAssignment } = useAssignmentStore()
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Drone | null>(null)
  const [assignForm, setAssignForm] = useState<{ missionId: string; droneId: string; scheduledAt?: string; notes?: string }>({ missionId: "", droneId: "", scheduledAt: "", notes: "" })
  const [form, setForm] = useState<{
    name: string
    model: string
    status: Drone["status"]
    mode: string
    battery: number
    signal: number
    lat: number
    lng: number
    altitude: number
  }>(() => ({ name: "", model: "", status: "offline", mode: "Standby", battery: 100, signal: 0, lat: 0, lng: 0, altitude: 0 }))

  const filtered = useMemo(() => {
    return drones.filter((d) => {
      const matchQ = query ? (d.name + " " + d.model).toLowerCase().includes(query.toLowerCase()) : true
      const matchS = status === "all" ? true : d.status === (status as Drone["status"]) || (status === "online" && d.status === "flying")
      return matchQ && matchS
    })
  }, [drones, query, status])

  const beginCreate = () => {
    setEditing(null)
    setForm({ name: "", model: "", status: "offline", mode: "Standby", battery: 100, signal: 0, lat: 0, lng: 0, altitude: 0 })
    setOpen(true)
  }

  const beginEdit = (d: Drone) => {
    setEditing(d)
    setForm({
      name: d.name,
      model: d.model,
      status: d.status,
      mode: d.mode,
      battery: d.battery,
      signal: d.signal,
      lat: d.location?.lat ?? 0,
      lng: d.location?.lng ?? 0,
      altitude: d.location?.altitude ?? 0,
    })
    setOpen(true)
  }

  const validForm =
    form.name.trim().length > 0 &&
    form.model.trim().length > 0 &&
    form.battery >= 0 &&
    form.battery <= 100 &&
    form.signal >= 0 &&
    form.signal <= 100

  const submit = () => {
    if (!validForm) return
    if (editing) {
      updateDrone(editing.id, {
        name: form.name.trim(),
        model: form.model.trim(),
        status: form.status,
        mode: form.mode.trim() || "Standby",
        battery: Math.max(0, Math.min(100, Math.round(form.battery))),
        signal: Math.max(0, Math.min(100, Math.round(form.signal))),
        location: { lat: Number(form.lat) || 0, lng: Number(form.lng) || 0, altitude: Number(form.altitude) || 0 },
      })
    } else {
      addDrone({
        name: form.name.trim(),
        model: form.model.trim(),
        status: form.status,
        mode: form.mode.trim() || "Standby",
        battery: Math.max(0, Math.min(100, Math.round(form.battery))),
        signal: Math.max(0, Math.min(100, Math.round(form.signal))),
        location: { lat: Number(form.lat) || 0, lng: Number(form.lng) || 0, altitude: Number(form.altitude) || 0 },
      } as any)
    }
    setOpen(false)
  }

  const activeDrones = useMemo(() => drones.filter((d) => d.status === "online" || d.status === "flying"), [drones])

  useEffect(() => {
    let destroyed = false
    async function init() {
      if (!mapEl.current) return
      const L = (await import("leaflet")).default
      await import("leaflet-draw")
      if (destroyed) return
      // Fix default marker icons in Next.js
      const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
      const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
      const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      ;(L as any).Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
      const map = L.map(mapEl.current, { zoomControl: true })
      mapRef.current = map
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      })
      osm.addTo(map)
      map.setView([0, 0], 2)
      markersLayerRef.current = new (L as any).LayerGroup()
      markersLayerRef.current.addTo(map)
    }
    init()
    return () => {
      destroyed = true
      try { mapRef.current && mapRef.current.remove() } catch {}
    }
  }, [])

  useEffect(() => {
    async function updateMarkers() {
      const L = (await import("leaflet")).default
      if (!mapRef.current || !markersLayerRef.current) return
      markersLayerRef.current.clearLayers()
      const bounds = new (L as any).LatLngBounds([])
      activeDrones.forEach((d) => {
        const lat = d.location?.lat ?? 0
        const lng = d.location?.lng ?? 0
        const marker = (L as any).marker([lat, lng])
          .bindPopup(`<b>${d.name}</b><br/>${d.model}<br/>${d.status.toUpperCase()}`)
        markersLayerRef.current.addLayer(marker)
        bounds.extend([lat, lng])
      })
      if (activeDrones.length > 0 && bounds.isValid && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
      }
    }
    updateMarkers()
  }, [activeDrones])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(drones, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fleet.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    const text = await file.text()
    try {
      const arr = JSON.parse(text) as Partial<Drone>[]
      for (const x of arr) {
        if (!x?.name || !x?.model) continue
        addDrone({ name: String(x.name), model: String(x.model), status: x.status === "online" || x.status === "flying" ? "online" : "offline", mode: x.mode ? String(x.mode) : "Standby", battery: typeof x.battery === "number" ? x.battery : 100, signal: typeof x.signal === "number" ? x.signal : 0 })
      }
    } catch {}
  }

  return (
    <div className="h-full p-6 overflow-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-mono">FLEET MANAGEMENT</h1>
          <p className="text-muted-foreground font-mono">Manage drones, status, and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <input id="fleet-import" type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && importJson(e.target.files[0])} />
          <Button variant="outline" className="bg-transparent" onClick={() => document.getElementById("fleet-import")?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={exportJson}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={beginCreate}>
                <Plus className="h-4 w-4 mr-2" /> Add Drone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl z-[9999]">
              <DialogHeader>
                <DialogTitle className="font-mono">{editing ? "EDIT DRONE" : "ADD DRONE"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="font-mono text-xs">NAME</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. JAWJI-003" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model" className="font-mono text-xs">MODEL</Label>
                    <Input id="model" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="e.g. Autonomous X1" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">STATUS</Label>
                    <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Drone["status"] }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="flying">Flying</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">MODE</Label>
                    <Input value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))} placeholder="e.g. GPS-Denied / Standby" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">BATTERY (%)</Label>
                    <Input type="number" min={0} max={100} value={form.battery} onChange={(e) => setForm((f) => ({ ...f, battery: Number(e.target.value) }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">SIGNAL (%)</Label>
                    <Input type="number" min={0} max={100} value={form.signal} onChange={(e) => setForm((f) => ({ ...f, signal: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">LAT</Label>
                    <Input type="number" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: Number(e.target.value) }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">LNG</Label>
                    <Input type="number" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: Number(e.target.value) }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-mono text-xs">ALTITUDE (m)</Label>
                    <Input type="number" value={form.altitude} onChange={(e) => setForm((f) => ({ ...f, altitude: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="bg-transparent" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={!validForm}>{editing ? "Save" : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Drones Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapEl} className="h-72 w-full rounded-md overflow-hidden border" />
          <div className="text-xs text-muted-foreground mt-2">
            Showing {activeDrones.length} active drone{activeDrones.length === 1 ? "" : "s"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Search by name or model" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="flying">Flying</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((d) => {
              const active = selectedDrone === d.id
              return (
                <Card key={d.id} className={active ? "ring-2 ring-primary" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold font-mono">{d.name}</span>
                        {active && <Badge className="bg-primary">ACTIVE</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">{d.model}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {d.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">BATTERY</div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, d.battery))}%` }} />
                          </div>
                          <span>{Math.round(d.battery)}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">SIGNAL</div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, d.signal))}%` }} />
                          </div>
                          <span>{Math.round(d.signal)}%</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => selectDrone(d.id)} disabled={active}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Set Active
                      </Button>
                      <Button size="sm" variant="outline" className="bg-transparent" onClick={() => beginEdit(d)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="bg-transparent text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => removeDrone(d.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3">
                <div className="grid gap-1">
                  <Label className="font-mono text-xs">MISSION</Label>
                  <Select value={assignForm.missionId} onValueChange={(v) => setAssignForm((f) => ({ ...f, missionId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mission" />
                    </SelectTrigger>
                    <SelectContent>
                      {missions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="font-mono text-xs">DRONE</Label>
                  <Select value={assignForm.droneId} onValueChange={(v) => setAssignForm((f) => ({ ...f, droneId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select drone" />
                    </SelectTrigger>
                    <SelectContent>
                      {drones.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="font-mono text-xs">SCHEDULED AT</Label>
                  <Input type="datetime-local" value={assignForm.scheduledAt} onChange={(e) => setAssignForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div className="grid gap-1 md:col-span-1">
                  <Label className="font-mono text-xs">NOTES</Label>
                  <Input value={assignForm.notes} onChange={(e) => setAssignForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!assignForm.missionId || !assignForm.droneId) return
                    addAssignment({ missionId: assignForm.missionId, droneId: assignForm.droneId, scheduledAt: assignForm.scheduledAt, notes: assignForm.notes })
                    setAssignForm({ missionId: "", droneId: "", scheduledAt: "", notes: "" })
                  }}
                  disabled={!assignForm.missionId || !assignForm.droneId}
                >Assign</Button>
              </div>
              <div className="space-y-2">
                {assignments.length === 0 && (
                  <div className="text-sm text-muted-foreground">No assignments yet.</div>
                )}
                {assignments.map((a) => {
                  const mission = missions.find((m) => m.id === a.missionId)
                  const drone = drones.find((d) => d.id === a.droneId)
                  return (
                    <Card key={a.id}>
                      <CardContent className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{mission?.name ?? "Unknown mission"}</div>
                          <div className="text-xs text-muted-foreground truncate">{drone?.name ?? "Unknown drone"} • {a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : "Unscheduled"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{a.status.toUpperCase()}</Badge>
                          <Select value={a.status} onValueChange={(v) => updateAssignment(a.id, { status: v as AssignmentStatus })}>
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" className="bg-transparent" onClick={() => removeAssignment(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
            <TabsContent value="overview" className="text-sm text-muted-foreground">
              Assign drones to missions and track execution status.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
