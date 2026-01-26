"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
}

interface MapViewProps {
  waypoints: Waypoint[]
  selectedWaypoint: string | null
  onWaypointClick: (id: string) => void
  onMapClick?: (lat: number, lng: number) => void
  center?: [number, number]
  zoom?: number
  heading?: number
  flightPath?: { lat: number; lng: number }[]
  homePosition?: { lat: number; lng: number }
}

export function MapView({
  waypoints,
  selectedWaypoint,
  onWaypointClick,
  onMapClick,
  center = [37.7749, -122.4194],
  zoom = 13,
  heading,
  flightPath,
  homePosition,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const [activeLayer, setActiveLayer] = useState<"vector" | "dark" | "satellite">("vector")
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    let destroyed = false

    async function initMap() {
      if (!containerRef.current || mapInstanceRef.current) return

      const L = (await import("leaflet")).default

      // Fix icons
      const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
      const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
      const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
        ; (L as any).Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

      if (destroyed) return

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, zoom)

      mapInstanceRef.current = map

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map)

      // Add attribution to bottom-right
      L.control.attribution({ position: 'bottomright' }).addTo(map)

      layerGroupRef.current = L.layerGroup().addTo(map)

      // Add click handler
      map.on('click', (e: any) => {
        onMapClick?.(e.latlng.lat, e.latlng.lng)
      })

      setIsMapReady(true)
    }

    initMap()

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      destroyed = true
      resizeObserver.disconnect()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, []) // Init once

  // Update Layers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    import("leaflet").then((mod) => {
      const L = mod.default

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }

      let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      let attribution = '&copy; OpenStreetMap contributors'

      if (activeLayer === "dark") {
        tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution = '&copy; OpenStreetMap &copy; CartoDB'
      } else if (activeLayer === "satellite") {
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution = 'Tiles &copy; Esri'
      }

      tileLayerRef.current = L.tileLayer(tileUrl, { attribution }).addTo(map)
    })

  }, [activeLayer, isMapReady])

  // Update View
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom, isMapReady])

  // Update Waypoints
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !layerGroupRef.current) return

    import("leaflet").then((mod) => {
      const L = mod.default
      const layerGroup = layerGroupRef.current
      layerGroup.clearLayers()

      // Add path
      if (waypoints.length > 1) {
        const latlngs = waypoints.map(w => [w.lat, w.lng]) as [number, number][]
        (L as any).polyline(latlngs, { color: 'red', dashArray: '10, 10' }).addTo(layerGroup)
      }

      // Render Historical Flight Path
      if (flightPath && flightPath.length > 1) {
        const trail = flightPath.map(p => [p.lat, p.lng]) as [number, number][]
        (L as any).polyline(trail, { color: '#fbbf24', weight: 4, opacity: 0.6 }).addTo(layerGroup)
      }

      // Render Home Position
      if (homePosition && homePosition.lat && homePosition.lng) {
        const homeIcon = L.divIcon({
          className: 'bg-transparent',
          html: `<div class="flex items-center justify-center w-6 h-6 rounded bg-blue-500 border-2 border-white shadow-md text-white font-bold text-[10px]">H</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        (L as any).marker([homePosition.lat, homePosition.lng], { icon: homeIcon, zIndexOffset: 50 }).addTo(layerGroup)
      }

      // Add markers
      waypoints.forEach((wp, idx) => {
        const isCurrent = wp.action === "current"
        const isSelected = selectedWaypoint === wp.id

        const divIcon = L.divIcon({
          className: 'bg-transparent',
          html: isCurrent
            ? `<div class="relative flex items-center justify-center w-10 h-10">
                     <div class="absolute w-full h-full bg-primary/30 rounded-full animate-ping"></div>
                     <div class="relative w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg" style="transform: rotate(${heading || 0}deg)">
                        <div class="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
                     </div>
                   </div>`
            : `<div class="flex items-center justify-center w-8 h-8 rounded-full ${isSelected ? 'bg-primary ring-2 ring-white scale-110' : 'bg-primary/80'} text-white font-bold shadow-md text-xs">
                     ${idx + 1}
                   </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })

        const marker = (L as any).marker([wp.lat, wp.lng], { icon: divIcon, zIndexOffset: 100 })
        marker.on('click', () => onWaypointClick(wp.id))
        marker.addTo(layerGroup)
      })
    })

  }, [waypoints, selectedWaypoint, heading, isMapReady, flightPath, homePosition])


  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full outline-none bg-muted" />

      {/* Layer Control */}
      <div className="absolute top-4 left-4 z-[400]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-card/90 backdrop-blur border shadow-md">
              <Layers className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActiveLayer("vector")}>Vector</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveLayer("dark")}>Dark Ops</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveLayer("satellite")}>Satellite</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
