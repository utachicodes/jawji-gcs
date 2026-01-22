"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Play, Save, Trash2, MapPin, Clock, ChevronLeft, Layers, ArrowUp, Package, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useRouter, useSearchParams } from "next/navigation"
import { useMissionStore } from "@/lib/mission-store"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useFirebaseAuth } from "@/lib/auth-service"

// Kiosk Locations with pickup/dropoff types
const KIOSK_LOCATIONS = [
  { id: "k1", name: "Central Depot Alpha", lat: 37.7749, lng: -122.4194, type: "depot", category: "Depot" },
  { id: "k2", name: "Burger Haven", lat: 37.7850, lng: -122.4100, type: "dropoff", category: "Restaurant" },
  { id: "k3", name: "Sushi Express", lat: 37.7650, lng: -122.4300, type: "dropoff", category: "Restaurant" },
  { id: "k4", name: "Med-Center Supply", lat: 37.7600, lng: -122.4000, type: "dropoff", category: "Medical" },
  { id: "k5", name: "City Hall Pickup", lat: 37.7700, lng: -122.4200, type: "pickup", category: "Government" },
  { id: "k6", name: "Tech Campus Pickup", lat: 37.7800, lng: -122.4150, type: "pickup", category: "Business" },
]

interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
  kioskId?: string
}

interface KioskLocation {
  id: string
  name: string
  lat: number
  lng: number
  type: "pickup" | "dropoff" | "depot"
  category: string
}

export function MissionPlanning() {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const pathLayerRef = useRef<any>(null)
  const router = useRouter()
  const params = useSearchParams()
  const { missions, addMission, updateMission } = useMissionStore()
  const { user } = useFirebaseAuth()

  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194])
  const [mapZoom, setMapZoom] = useState(15)
  const [missionName, setMissionName] = useState("New Operation")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Kiosk selection state
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null)
  const [selectedDropoff, setSelectedDropoff] = useState<string | null>(null)

  // Side Panel State - Default hidden on mobile
  const [showLeftPanel, setShowLeftPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<"kiosks" | "waypoints" | "config">("kiosks")

  // Auto-show panel on desktop, hide on mobile
  useEffect(() => {
    const updatePanelVisibility = () => {
      if (window.innerWidth >= 768) {
        setShowLeftPanel(true)
      }
    }
    updatePanelVisibility()
    window.addEventListener('resize', updatePanelVisibility)
    return () => window.removeEventListener('resize', updatePanelVisibility)
  }, [])

  // Load mission if editing
  const missionIdParam = params.get("missionId") || null
  useEffect(() => {
    if (!missionIdParam) return
    const mission = missions.find((m) => m.id === missionIdParam)
    if (!mission) return
    setEditingId(mission.id)
    setMissionName(mission.name)
    if (mission.waypointData && mission.waypointData.length > 0) {
      setWaypoints(mission.waypointData.map((w) => ({ ...w })))
    }
  }, [missionIdParam, missions])

  // Auto-generate waypoints when pickup/dropoff selected
  useEffect(() => {
    if (!selectedPickup || !selectedDropoff) return

    const pickup = KIOSK_LOCATIONS.find(k => k.id === selectedPickup)
    const dropoff = KIOSK_LOCATIONS.find(k => k.id === selectedDropoff)

    if (!pickup || !dropoff) return

    const newWaypoints: Waypoint[] = [
      {
        id: "1",
        lat: pickup.lat,
        lng: pickup.lng,
        altitude: 50,
        action: "pickup",
        speed: 5,
        kioskId: pickup.id
      },
      {
        id: "2",
        lat: dropoff.lat,
        lng: dropoff.lng,
        altitude: 50,
        action: "dropoff",
        speed: 5,
        kioskId: dropoff.id
      }
    ]

    setWaypoints(newWaypoints)
    toast.success("Route generated from pickup to dropoff")
  }, [selectedPickup, selectedDropoff])

  // Map Initialization
  useEffect(() => {
    let destroyed = false
    async function init() {
      if (!mapEl.current) return
      const L = (await import("leaflet")).default
      if (destroyed) return

      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: false
      })
      mapRef.current = map

      const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19
      })

      satellite.addTo(map)

      map.setView(mapCenter, mapZoom)
      markersLayerRef.current = new (L as any).LayerGroup().addTo(map)
      pathLayerRef.current = (L as any).polyline([], { color: "#3b82f6", weight: 4, opacity: 0.8, lineCap: 'round' }).addTo(map)

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
      try { mapRef.current && mapRef.current.remove() } catch { }
    }
  }, [])

  // Refresh Layers
  useEffect(() => {
    async function refreshLayers() {
      const L = (await import("leaflet")).default
      if (!mapRef.current || !markersLayerRef.current || !pathLayerRef.current) return

      markersLayerRef.current.clearLayers()
      const latlngs: any[] = []

      // Add kiosk markers
      KIOSK_LOCATIONS.forEach((kiosk) => {
        const isPickup = kiosk.id === selectedPickup
        const isDropoff = kiosk.id === selectedDropoff
        const isSelected = isPickup || isDropoff

        let color = "bg-muted"
        let icon = "📍"

        if (kiosk.type === "pickup") {
          color = isPickup ? "bg-blue-500" : "bg-blue-500/30"
          icon = "📦"
        } else if (kiosk.type === "dropoff") {
          color = isDropoff ? "bg-green-500" : "bg-green-500/30"
          icon = "🏢"
        } else {
          color = "bg-purple-500/50"
          icon = "🏭"
        }

        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full ${color} ${isSelected ? 'scale-125 shadow-lg' : ''} flex items-center justify-center text-sm font-bold transition-all duration-300">
              ${icon}
            </div>
          </div>
        `

        const markerIcon = L.divIcon({
          html: iconHtml,
          className: 'bg-transparent',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        const marker = (L as any).marker([kiosk.lat, kiosk.lng], {
          icon: markerIcon
        })

        marker.on("click", () => {
          if (kiosk.type === "pickup") {
            setSelectedPickup(kiosk.id)
          } else if (kiosk.type === "dropoff") {
            setSelectedDropoff(kiosk.id)
          }
          setActiveTab("kiosks")
          if (!showLeftPanel) setShowLeftPanel(true)
        })

        markersLayerRef.current.addLayer(marker)
      })

      // Add waypoint markers
      waypoints.forEach((wp, idx) => {
        const isSelected = selectedWaypoint === wp.id
        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-primary scale-110 shadow-[0_0_20px_rgba(var(--primary),0.5)]' : 'bg-background/80 border-2 border-primary'} flex items-center justify-center text-xs font-bold transition-all duration-300 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}">
              ${idx + 1}
            </div>
            ${isSelected ? `<div class="absolute -bottom-1 w-2 h-2 bg-primary rotate-45"></div>` : ''}
          </div>
        `

        const icon = L.divIcon({
          html: iconHtml,
          className: 'bg-transparent',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })

        const marker = (L as any).marker([wp.lat, wp.lng], {
          draggable: true,
          icon: icon
        })

        marker.on("click", () => {
          setSelectedWaypoint(wp.id)
          setActiveTab("waypoints")
          if (!showLeftPanel) setShowLeftPanel(true)
        })

        marker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setWaypoints((prev) => prev.map((w) => (w.id === wp.id ? { ...w, lat, lng } : w)))
        })

        markersLayerRef.current.addLayer(marker)
        latlngs.push([wp.lat, wp.lng])
      })

      pathLayerRef.current.setLatLngs(latlngs)
    }
    refreshLayers()
  }, [waypoints, selectedWaypoint, showLeftPanel, selectedPickup, selectedDropoff])

  const handleMapClick = (lat: number, lng: number) => {
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      lat,
      lng,
      altitude: 50,
      action: "hover",
      speed: 5,
    }
    setWaypoints(prev => [...prev, newWaypoint])
    setSelectedWaypoint(newWaypoint.id)
    setActiveTab("waypoints")
    if (!showLeftPanel) setShowLeftPanel(true)
  }

  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)))
  }

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((wp) => wp.id !== id))
    if (selectedWaypoint === id) setSelectedWaypoint(null)
  }

  const calculateTotalDistance = () => {
    if (waypoints.length < 2) return 0
    let total = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const lat1 = waypoints[i].lat
      const lon1 = waypoints[i].lng
      const lat2 = waypoints[i + 1].lat
      const lon2 = waypoints[i + 1].lng

      const R = 6371e3
      const φ1 = lat1 * Math.PI / 180
      const φ2 = lat2 * Math.PI / 180
      const Δφ = (lat2 - lat1) * Math.PI / 180
      const Δλ = (lon2 - lon1) * Math.PI / 180

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      total += R * c
    }
    return total / 1000
  }

  const distance = calculateTotalDistance()
  const estTime = (distance * 1000) / 5 / 60

  const handleSave = () => {
    const payload = {
      name: missionName,
      description: selectedPickup && selectedDropoff
        ? `Delivery from ${KIOSK_LOCATIONS.find(k => k.id === selectedPickup)?.name} to ${KIOSK_LOCATIONS.find(k => k.id === selectedDropoff)?.name}`
        : "",
      waypoints: waypoints.length,
      distance: Number(distance.toFixed(2)),
      duration: Math.ceil(estTime),
      status: "draft" as const,
      waypointData: waypoints,
    }

    if (editingId) {
      updateMission(editingId, payload)
      toast.success("Mission updated successfully")
    } else {
      addMission(payload, user)
      toast.success("Mission created successfully")
    }
    router.push("/missions")
  }

  const getKioskIcon = (type: string) => {
    switch (type) {
      case "pickup": return <Package className="w-4 h-4" />
      case "dropoff": return <Building2 className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="h-full w-full relative bg-background overflow-hidden font-sans">
      {/* Fullscreen Map */}
      <div ref={mapEl} className="absolute inset-0 z-0 bg-muted/20" />

      {/* Background Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* TOP BAR - Responsive */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-2 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-xl border border-border/50 p-1 pl-3 rounded-full flex items-center gap-2 sm:gap-3 shadow-lg pointer-events-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={() => router.push('/missions')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block"></div>
          <Input
            value={missionName}
            onChange={(e) => setMissionName(e.target.value)}
            className="h-8 border-none bg-transparent w-full sm:w-48 focus-visible:ring-0 font-bold tracking-tight text-sm sm:text-base"
          />
          <Badge variant="outline" className="mr-1 bg-primary/10 text-primary border-primary/20 text-xs shrink-0">DRAFT</Badge>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <Button variant="secondary" className="flex-1 sm:flex-none h-10 rounded-full shadow-lg backdrop-blur-md bg-card/90 border border-border/50 text-sm" onClick={handleSave}>
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
          <Button className="flex-1 sm:flex-none h-10 rounded-full shadow-lg shadow-primary/20 text-sm" onClick={() => { handleSave(); router.push('/preflight') }}>
            <Play className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Engage</span>
          </Button>
        </div>
      </div>

      {/* LEFT PANEL */}
      <AnimatePresence>
        {showLeftPanel && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 sm:top-20 left-2 sm:left-4 bottom-20 sm:bottom-24 w-[calc(100%-1rem)] sm:w-80 max-w-md z-20 flex flex-col gap-2 pointer-events-none"
          >
            <div className="flex-1 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
              {/* Tabs */}
              <div className="flex p-1 m-2 bg-muted/50 rounded-lg shrink-0">
                <button
                  onClick={() => setActiveTab("kiosks")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "kiosks" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Kiosks
                </button>
                <button
                  onClick={() => setActiveTab("waypoints")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "waypoints" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Waypoints ({waypoints.length})
                </button>
                <button
                  onClick={() => setActiveTab("config")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "config" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Config
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === "kiosks" ? (
                  <>
                    <div className="space-y-3">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Pickup Location</Label>
                      <Select value={selectedPickup || ""} onValueChange={setSelectedPickup}>
                        <SelectTrigger className="bg-card/50 border-border/50">
                          <SelectValue placeholder="Select pickup location" />
                        </SelectTrigger>
                        <SelectContent>
                          {KIOSK_LOCATIONS.filter(k => k.type === "pickup" || k.type === "depot").map(kiosk => (
                            <SelectItem key={kiosk.id} value={kiosk.id}>
                              <div className="flex items-center gap-2">
                                {getKioskIcon(kiosk.type)}
                                <span>{kiosk.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Dropoff Location</Label>
                      <Select value={selectedDropoff || ""} onValueChange={setSelectedDropoff}>
                        <SelectTrigger className="bg-card/50 border-border/50">
                          <SelectValue placeholder="Select dropoff location" />
                        </SelectTrigger>
                        <SelectContent>
                          {KIOSK_LOCATIONS.filter(k => k.type === "dropoff" || k.type === "depot").map(kiosk => (
                            <SelectItem key={kiosk.id} value={kiosk.id}>
                              <div className="flex items-center gap-2">
                                {getKioskIcon(kiosk.type)}
                                <span>{kiosk.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPickup && selectedDropoff && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-primary font-medium">
                          ✓ Route configured from {KIOSK_LOCATIONS.find(k => k.id === selectedPickup)?.name} to {KIOSK_LOCATIONS.find(k => k.id === selectedDropoff)?.name}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Available Kiosks</Label>
                      <div className="space-y-2">
                        {KIOSK_LOCATIONS.map(kiosk => (
                          <div key={kiosk.id} className="p-2 rounded-lg bg-card/50 border border-border/50 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getKioskIcon(kiosk.type)}
                                <span className="font-medium">{kiosk.name}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{kiosk.category}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : activeTab === "waypoints" ? (
                  <div className="space-y-2">
                    {waypoints.map((wp, i) => (
                      <div
                        key={wp.id}
                        onClick={() => setSelectedWaypoint(wp.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${selectedWaypoint === wp.id ? "bg-primary/5 border-primary/50 shadow-sm" : "bg-card/50 border-border/50"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedWaypoint === wp.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {i + 1}
                            </div>
                            <span className="text-sm font-medium">
                              {wp.action === "pickup" ? "🏢 Pickup" : wp.action === "dropoff" ? "📦 Dropoff" : `Waypoint ${i + 1}`}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeWaypoint(wp.id) }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {selectedWaypoint === wp.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="space-y-2 pt-2 border-t border-border/50"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Altitude (m)</Label>
                                <Input
                                  type="number"
                                  className="h-7 text-xs bg-card/50"
                                  value={wp.altitude}
                                  onChange={(e) => updateWaypoint(wp.id, { altitude: Number(e.target.value) })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Action</Label>
                                <Select value={wp.action} onValueChange={(v) => updateWaypoint(wp.id, { action: v })}>
                                  <SelectTrigger className="h-7 text-xs bg-card/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hover">Hover</SelectItem>
                                    <SelectItem value="land">Land</SelectItem>
                                    <SelectItem value="pickup">Pickup</SelectItem>
                                    <SelectItem value="dropoff">Dropoff</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full border-dashed bg-card/50" onClick={() => {
                      const last = waypoints[waypoints.length - 1];
                      const lat = last ? last.lat + 0.001 : mapCenter[0];
                      const lng = last ? last.lng + 0.001 : mapCenter[1];
                      handleMapClick(lat, lng)
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Waypoint
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Flight Parameters</Label>
                      <div className="space-y-3 p-3 rounded-lg bg-card/50 border border-border/50">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">Cruise Speed</Label>
                          <span className="text-xs font-mono text-primary">5 m/s</span>
                        </div>
                        <Slider defaultValue={[5]} max={15} step={1} className="py-1" />
                      </div>
                      <div className="space-y-3 p-3 rounded-lg bg-card/50 border border-border/50">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">Return Altitude</Label>
                          <span className="text-xs font-mono text-primary">100 m</span>
                        </div>
                        <Slider defaultValue={[100]} max={200} step={5} className="py-1" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Automated Actions</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Obstacle Avoidance</Label>
                          <p className="text-[10px] text-muted-foreground">Bypass obstacles automatically</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Smart Return</Label>
                          <p className="text-[10px] text-muted-foreground">RTH on low battery/link loss</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM STATS BAR - Responsive */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-20 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-xl border border-border/50 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 sm:justify-between text-card-foreground pointer-events-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 flex-1">
            <div className="flex items-center justify-between sm:block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> <span className="hidden sm:inline">Total </span>Distance
              </div>
              <div className="text-xl sm:text-2xl font-mono font-medium tracking-tight">
                {distance.toFixed(2)} <span className="text-xs sm:text-sm text-muted-foreground font-sans">km</span>
              </div>
            </div>
            <div className="hidden sm:block w-px bg-border/50 h-10" />
            <div className="flex items-center justify-between sm:block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Est. Time
              </div>
              <div className="text-xl sm:text-2xl font-mono font-medium tracking-tight">
                {Math.floor(estTime)} <span className="text-xs sm:text-sm text-muted-foreground font-sans">min</span> {Math.round((estTime % 1) * 60)} <span className="text-xs sm:text-sm text-muted-foreground font-sans">s</span>
              </div>
            </div>
            <div className="hidden sm:block w-px bg-border/50 h-10" />
            <div className="flex items-center justify-between sm:block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                <ArrowUp className="w-3 h-3" /> Max Alt
              </div>
              <div className="text-xl sm:text-2xl font-mono font-medium tracking-tight">
                {Math.max(...waypoints.map(w => w.altitude), 0)} <span className="text-xs sm:text-sm text-muted-foreground font-sans">m</span>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowLeftPanel(!showLeftPanel)} className={`shrink-0 ${showLeftPanel ? "bg-muted" : ""}`}>
            <Layers className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
