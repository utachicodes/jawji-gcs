"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"

// Fix for Leaflet marker icons in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

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
}

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194]

export function MapView({
  waypoints,
  selectedWaypoint,
  onWaypointClick,
  onMapClick,
  center = DEFAULT_CENTER,
  zoom = 18, // Satellite needs closer zoom usually
  heading = 0,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const polylineRef = useRef<L.Polyline | null>(null)
  const droneMarkerRef = useRef<L.Marker | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      attributionControl: false, // User requested removal
      zoomControl: false, // We'll add custom or rely on scroll
    })

    // Custom Zoom Control at bottom-right (moved from top-right to avoid overlap)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Add Esri World Imagery (Satellite)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    }).addTo(map)

    // Map Click Handler
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, []) // Init once

  // Update Center/Zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return
    // Use flyTo for smooth transition if distance isn't too huge, otherwise setView
    mapInstanceRef.current.setView(center, zoom)
  }, [center, zoom])

  // Update Waypoints & Path
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // 1. Clear old markers/polyline
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    if (polylineRef.current) polylineRef.current.remove()
    if (droneMarkerRef.current) droneMarkerRef.current.remove()

    // 2. Draw Polyline
    if (waypoints.length > 1) {
      const latlngs = waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
      polylineRef.current = L.polyline(latlngs, {
        color: 'hsl(var(--primary))', // Cyan/Primary
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.8
      }).addTo(map)
    }

    // 3. Draw Markers
    waypoints.forEach((wp, index) => {
      const isSelected = selectedWaypoint === wp.id

      // Custom Icon
      const icon = L.divIcon({
        className: 'bg-transparent border-none',
        html: `
                <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
                    <div class="flex items-center justify-center rounded-full font-bold text-sm transition-all shadow-md ${isSelected
            ? "w-10 h-10 bg-primary text-primary-foreground ring-4 ring-primary/30 z-[1000]"
            : "w-8 h-8 bg-primary/80 text-primary-foreground"
          }">
                        ${index + 1}
                    </div>
                </div>
            `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })

      const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(map)

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        onWaypointClick(wp.id)
      })

      markersRef.current[wp.id] = marker
    })

  }, [waypoints, selectedWaypoint, onWaypointClick])


  // Update Drone Marker (Heading/Position)
  // We assume the "current" drone position might be passed as a special waypoint or separate prop.
  // In the previous component, it looked for `waypoint.action === "current"`.
  // Let's replicate that logic inside the waypoints loop or separate it if possible.
  // Wait, looking at previous code: 
  /*
     {waypoint.action === "current" ? ( ... DRONE UI ... ) : ( ... NUMBER UI ... )}
  */
  // So the drone IS one of the waypoints with action "current".
  // My loop above just draws numbers. I need to handle action="current" differently.

  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Find drone waypoint if any
    const droneWp = waypoints.find(w => w.action === "current")

    if (droneWp) {
      // Remove generic marker for it if it was added (it was added in the loop above, which is inefficient but simple)
      // Let's refine the loop above to SKIP 'current' and handle it here, or handle it inside the loop.
      // Handling inside the loop is better for React deps.
    }
  }, [waypoints, heading])


  // Re-run the marker loop to include Drone Logic properly
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Clear everything first
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    if (polylineRef.current) polylineRef.current.remove()

    // Draw Polyline (excluding 'current' if it's strictly the drone, but usually waypoints are the path)
    // Assuming 'current' IS the drone and shouldn't be part of the path line? 
    // Usually GCS shows path + drone.
    const pathWaypoints = waypoints.filter(w => w.action !== 'current')
    if (pathWaypoints.length > 1) {
      const latlngs = pathWaypoints.map(wp => [wp.lat, wp.lng] as [number, number])
      polylineRef.current = L.polyline(latlngs, {
        color: '#06b6d4', // Cyan
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.8
      }).addTo(map)
    }

    // Draw Waypoints
    waypoints.forEach((wp, index) => {
      const isSelected = selectedWaypoint === wp.id
      const isDrone = wp.action === "current"

      let html = ''
      let zIndexOffset = 0

      if (isDrone) {
        zIndexOffset = 1000
        html = `
              <div class="relative flex items-center justify-center">
                  <span class="absolute inset-0 -m-2 rounded-full bg-cyan-500/30 blur-md animate-ping"></span>
                  <!-- Heading Arrow -->
                  <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style="transform: translate(-50%, -50%) rotate(${heading}deg);">
                     <div class="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-cyan-500 filter drop-shadow-lg"></div>
                  </div>
                  <!-- Halo -->
                  <div class="w-10 h-10 rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
              </div>
            `
      } else {
        // Numbered Waypoint
        // Adjust index to match visual list (1-based, excluding drone if needed, but simple index is fine)
        // Use waypoints index or path index? Let's use generic index for now.
        html = `
                <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
                    <div class="flex items-center justify-center rounded-full font-bold text-sm transition-all shadow-md ${isSelected
            ? "w-8 h-8 bg-cyan-600 text-white ring-2 ring-white scale-110"
            : "w-6 h-6 bg-cyan-800/90 text-white border border-white/20"
          }">
                        ${index + 1}
                    </div>
                </div>
            `
      }

      const icon = L.divIcon({
        className: 'bg-transparent border-none',
        html: html,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })

      const marker = L.marker([wp.lat, wp.lng], {
        icon,
        zIndexOffset
      }).addTo(map)

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        onWaypointClick(wp.id)
      })

      markersRef.current[wp.id] = marker
    })

  }, [waypoints, selectedWaypoint, onWaypointClick, heading])

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden bg-muted">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Attribution Hiding is done in global CSS, but we also disabled it in Leaflet config above */}


    </div>
  )
}
