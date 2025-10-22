"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Play, Save, Trash2, MapPin, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useRouter, useSearchParams } from "next/navigation"
import { useMissionStore } from "@/lib/mission-store"
import { MapGeofence } from "@/components/map-geofence"

interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
}

export function MissionPlanning() {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const pathLayerRef = useRef<any>(null)
  const router = useRouter()
  const params = useSearchParams()
  const missions = useMissionStore((s) => s.missions)
  const addMission = useMissionStore((s) => s.addMission)
  const updateMission = useMissionStore((s) => s.updateMission)
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { id: "1", lat: 37.7749, lng: -122.4194, altitude: 50, action: "hover", speed: 5 },
    { id: "2", lat: 37.7755, lng: -122.4185, altitude: 75, action: "capture", speed: 3 },
    { id: "3", lat: 37.776, lng: -122.4175, altitude: 60, action: "scan", speed: 4 },
  ])
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194])
  const [mapZoom, setMapZoom] = useState(15)
  const [missionName, setMissionName] = useState("Survey Mission 01")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [geofence, setGeofence] = useState<string>("")

  // Load mission if editing
  const missionIdParam = params.get("missionId") || null
  useEffect(() => {
    if (!missionIdParam) return
    const mission = missions.find((m) => m.id === missionIdParam)
    if (!mission) return
    // Avoid unnecessary state updates
    setEditingId((prev) => (prev === missionIdParam ? prev : missionIdParam))
    setMissionName((prev) => (prev === mission.name ? prev : mission.name))
    if (mission.waypointData && mission.waypointData.length > 0) {
      setWaypoints((prev) => {
        // shallow compare lengths as a simple guard
        if (prev.length === mission.waypointData!.length) return prev
        return mission.waypointData!.map((w) => ({ ...w }))
      })
    }
    if (mission.geofence) {
      setGeofence(mission.geofence)
    }
  }, [missionIdParam, missions])

  const handleMapClick = (lat: number, lng: number) => {
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      lat,
      lng,
      altitude: 50,
      action: "hover",
      speed: 5,
    }
    setWaypoints([...waypoints, newWaypoint])
    setSelectedWaypoint(newWaypoint.id)
  }

  useEffect(() => {
    let destroyed = false
    async function init() {
      if (!mapEl.current) return
      const L = (await import("leaflet")).default
      if (destroyed) return
      const map = L.map(mapEl.current, { zoomControl: true })
      mapRef.current = map
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      })
      osm.addTo(map)
      map.setView(mapCenter, mapZoom)
      markersLayerRef.current = new (L as any).LayerGroup().addTo(map)
      pathLayerRef.current = (L as any).polyline([], { color: "#16a34a", weight: 3, dashArray: "10,10", opacity: 0.7 }).addTo(map)

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        handleMapClick(lat, lng)
      })
      const updateView = () => {
        const c = map.getCenter()
        setMapCenter([c.lat, c.lng])
        setMapZoom(map.getZoom())
      }
      map.on("moveend", updateView)
      map.on("zoomend", updateView)
    }
    init()
    return () => {
      destroyed = true
      try { mapRef.current && mapRef.current.remove() } catch {}
    }
  }, [])

  useEffect(() => {
    async function refreshLayers() {
      const L = (await import("leaflet")).default
      if (!mapRef.current || !markersLayerRef.current || !pathLayerRef.current) return
      markersLayerRef.current.clearLayers()
      const latlngs: any[] = []
      waypoints.forEach((wp, idx) => {
        const marker = (L as any).marker([wp.lat, wp.lng], { draggable: true })
        if (selectedWaypoint === wp.id) {
          marker.bindPopup(`<b>Waypoint ${idx + 1}</b>`).openPopup()
        } else {
          marker.bindPopup(`Waypoint ${idx + 1}`)
        }
        marker.on("click", () => setSelectedWaypoint(wp.id))
        marker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setWaypoints((prev) => prev.map((w) => (w.id === wp.id ? { ...w, lat, lng } : w)))
        })
        markersLayerRef.current.addLayer(marker)
        latlngs.push([wp.lat, wp.lng])
      })
      pathLayerRef.current.setLatLngs(latlngs)
      if (latlngs.length > 0) {
        const bounds = (L as any).latLngBounds(latlngs)
        if (bounds.isValid && bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 })
        }
      }
    }
    refreshLayers()
  }, [waypoints, selectedWaypoint])

  const addWaypoint = () => {
    const lastWaypoint = waypoints[waypoints.length - 1]
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      lat: lastWaypoint ? lastWaypoint.lat + 0.001 : 37.7749,
      lng: lastWaypoint ? lastWaypoint.lng + 0.001 : -122.4194,
      altitude: 50,
      action: "hover",
      speed: 5,
    }
    setWaypoints([...waypoints, newWaypoint])
    setSelectedWaypoint(newWaypoint.id)
  }

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((wp) => wp.id !== id))
    if (selectedWaypoint === id) setSelectedWaypoint(null)
  }

  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)))
  }

  const calculateDistance = () => {
    if (waypoints.length < 2) return 0
    let total = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const lat1 = waypoints[i].lat
      const lon1 = waypoints[i].lng
      const lat2 = waypoints[i + 1].lat
      const lon2 = waypoints[i + 1].lng
      const R = 6371 // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      total += R * c
    }
    return total
  }

  const totalDistance = calculateDistance()
  const estimatedTime = totalDistance > 0 ? (totalDistance / 0.005) * 60 : 0 // Assuming 5 m/s average speed

  const handleSave = () => {
    const payload = {
      name: missionName.trim() || "Untitled Mission",
      description: "Auto-created from Mission Planner",
      waypoints: waypoints.length,
      distance: Number(totalDistance.toFixed(2)),
      duration: Math.max(0, Math.round(estimatedTime)),
      status: "draft" as const,
      waypointData: waypoints.map((w) => ({ ...w })),
      geofence: geofence || undefined,
    }
    if (editingId) {
      updateMission(editingId, payload)
      router.push("/missions")
    } else {
      const mission = addMission(payload)
      router.push("/missions")
    }
  }

  const handleStart = () => {
    const payload = {
      name: missionName.trim() || "Untitled Mission",
      description: "Auto-created from Mission Planner",
      waypoints: waypoints.length,
      distance: Number(totalDistance.toFixed(2)),
      duration: Math.max(0, Math.round(estimatedTime)),
      status: "draft" as const,
      waypointData: waypoints.map((w) => ({ ...w })),
    }
    if (editingId) {
      updateMission(editingId, payload)
      router.push(`/preflight?missionId=${editingId}`)
    } else {
      const mission = addMission(payload)
      router.push(`/preflight?missionId=${mission.id}`)
    }
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 relative">
        <div ref={mapEl} className="w-full h-full rounded-lg overflow-hidden border bg-muted" />

        {/* Map Info */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 space-y-1 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Center:</span>
            <span className="font-mono">
              {mapCenter[0].toFixed(4)}°N, {Math.abs(mapCenter[1]).toFixed(4)}°W
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Total Distance:</span>
            <span className="font-mono">{totalDistance.toFixed(2)} km</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Est. Flight Time:</span>
            <span className="font-mono">
              {Math.floor(estimatedTime)} min {Math.floor((estimatedTime % 1) * 60)}s
            </span>
          </div>
        </div>
      </div>

      {/* Mission Panel */}
      <div className="w-96 border-l border-border bg-card overflow-auto">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Mission Planning</h2>
            <p className="text-sm text-muted-foreground">Create and configure autonomous flight missions</p>
          </div>

          <Tabs defaultValue="mission" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mission">Mission</TabsTrigger>
              <TabsTrigger value="waypoints">Waypoints</TabsTrigger>
              <TabsTrigger value="geofence">Geofence</TabsTrigger>
            </TabsList>

            <TabsContent value="mission" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Mission Name</Label>
                <Input placeholder="Enter mission name" value={missionName} onChange={(e) => setMissionName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Flight Mode</Label>
                <Select defaultValue="autonomous">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autonomous">Autonomous</SelectItem>
                    <SelectItem value="assisted">Assisted</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Navigation Mode</Label>
                <Select defaultValue="visual-slam">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual-slam">Visual SLAM</SelectItem>
                    <SelectItem value="lidar">LiDAR</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Altitude (m)</Label>
                  <span className="text-sm text-muted-foreground">100m</span>
                </div>
                <Slider defaultValue={[100]} max={200} step={5} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cruise Speed (m/s)</Label>
                  <span className="text-sm text-muted-foreground">5 m/s</span>
                </div>
                <Slider defaultValue={[5]} max={15} step={1} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Return to Home</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Obstacle Avoidance</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-Land on Low Battery</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="waypoints" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label>Waypoints ({waypoints.length})</Label>
                <Button size="sm" variant="outline" onClick={addWaypoint}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Click on the map to add waypoints or use the button above.
              </p>

              <div className="space-y-2 max-h-[500px] overflow-auto">
                {waypoints.map((waypoint, index) => (
                  <Card
                    key={waypoint.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedWaypoint === waypoint.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedWaypoint(waypoint.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">Waypoint {index + 1}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeWaypoint(waypoint.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Lat:</span>
                          <Input
                            type="number"
                            value={waypoint.lat}
                            onChange={(e) => updateWaypoint(waypoint.id, { lat: Number.parseFloat(e.target.value) })}
                            className="h-7 mt-1 text-xs"
                            step="0.0001"
                          />
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lng:</span>
                          <Input
                            type="number"
                            value={waypoint.lng}
                            onChange={(e) => updateWaypoint(waypoint.id, { lng: Number.parseFloat(e.target.value) })}
                            className="h-7 mt-1 text-xs"
                            step="0.0001"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Alt (m):</span>
                          <Input
                            type="number"
                            value={waypoint.altitude}
                            onChange={(e) => updateWaypoint(waypoint.id, { altitude: Number.parseInt(e.target.value) })}
                            className="h-7 mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-muted-foreground">Speed:</span>
                          <Input
                            type="number"
                            value={waypoint.speed}
                            onChange={(e) => updateWaypoint(waypoint.id, { speed: Number.parseInt(e.target.value) })}
                            className="h-7 mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Action:</span>
                        <Select
                          value={waypoint.action}
                          onValueChange={(value) => updateWaypoint(waypoint.id, { action: value })}
                        >
                          <SelectTrigger className="h-7 mt-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hover">Hover</SelectItem>
                            <SelectItem value="capture">Capture Image</SelectItem>
                            <SelectItem value="scan">3D Scan</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="geofence" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Draw Geofence</Label>
                <p className="text-xs text-muted-foreground">Use the map below to draw a polygon geofence. The GeoJSON will be saved with the mission.</p>
              </div>
              <MapGeofence value={geofence} onChange={setGeofence} />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button className="flex-1 bg-transparent" variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button className="flex-1" onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />
              Start Mission
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
