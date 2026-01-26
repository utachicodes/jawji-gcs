"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type LeafletModule = typeof import("leaflet")

export function MapGeofence({ value, onChange }: { value?: string; onChange: (geojson: string) => void }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletRef = useRef<LeafletModule | null>(null)
  const drawnRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const [geojsonText, setGeojsonText] = useState<string>(value || "")

  useEffect(() => {
    let destroyed = false
    async function init() {
      try {
        const L = (await import("leaflet")).default
        // Try to import leaflet-draw, catch specific error if it fails
        try {
          await import("leaflet-draw")
        } catch (e) {
          console.error("Leaflet draw import failed:", e)
        }

        if (destroyed || !mapRef.current) return
        leafletRef.current = L

        const map = L.map(mapRef.current, { zoomControl: true })
        mapInstanceRef.current = map
        const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        })
        osm.addTo(map)
        map.setView([0, 0], 2)

        const drawnItems = (drawnRef.current = new (L as any).FeatureGroup())
        map.addLayer(drawnItems)

        try {
          if ((L as any).Control && (L as any).Control.Draw) {
            const drawControl = new (L as any).Control.Draw({
              draw: {
                marker: false,
                circle: false,
                circlemarker: false,
                rectangle: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                },
              },
              edit: { featureGroup: drawnItems },
            })
            map.addControl(drawControl)

            map.on((L as any).Draw.Event.CREATED, (e: any) => {
              const layer = e.layer
              drawnItems.clearLayers()
              drawnItems.addLayer(layer)
              const gj = layer.toGeoJSON()
              const text = JSON.stringify(gj)
              setGeojsonText(text)
              onChange(text)
            })
          }
        } catch (drawError) {
          console.warn("Leaflet Draw control failed to init", drawError)
        }

        // Load initial value if provided
        try {
          if (value) {
            const gj = JSON.parse(value)
            const layer = (L as any).geoJSON(gj)
            layer.addTo(drawnItems)
            const b = layer.getBounds?.() || drawnItems.getBounds?.()
            if (b && b.isValid && b.isValid()) map.fitBounds(b, { padding: [20, 20] })
          }
        } catch { }
      } catch (err: any) {
        console.error("MapGeofence init failed:", err)
        // alert("Map Error: " + err.message) // Optional: uncomment if debugging with user visible feedback needed
      }
    }

    init()
    return () => {
      destroyed = true
      try {
        mapInstanceRef.current && mapInstanceRef.current.remove()
      } catch { }
    }
  }, [])

  return (
    <div className="space-y-3">
      <Card className="h-72 w-full overflow-hidden">
        <div ref={mapRef} className="h-full w-full" />
      </Card>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 h-10 rounded-md border bg-transparent px-3 text-sm outline-none"
          placeholder="GeoJSON polygon (auto-filled when drawing)"
          value={geojsonText}
          onChange={(e) => setGeojsonText(e.target.value)}
        />
        <Button type="button" onClick={() => onChange(geojsonText)}>
          Use selection
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-transparent"
          onClick={() => {
            try {
              drawnRef.current?.clearLayers()
              setGeojsonText("")
              onChange("")
            } catch { }
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
