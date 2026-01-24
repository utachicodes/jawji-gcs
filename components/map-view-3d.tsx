"use client"

import type React from "react"
import { useEffect, useMemo, useRef } from "react"

interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
}

export function MapView3D({ waypoints }: { waypoints: Waypoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const bounds = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1, minAlt: 0, maxAlt: 1 }
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity,
      minAlt = Infinity,
      maxAlt = -Infinity
    for (const w of waypoints) {
      minLat = Math.min(minLat, w.lat)
      maxLat = Math.max(maxLat, w.lat)
      minLng = Math.min(minLng, w.lng)
      maxLng = Math.max(maxLng, w.lng)
      minAlt = Math.min(minAlt, w.altitude)
      maxAlt = Math.max(maxAlt, w.altitude)
    }
    if (minAlt === maxAlt) maxAlt = minAlt + 1
    if (minLat === maxLat) maxLat = minLat + 0.0001
    if (minLng === maxLng) maxLng = minLng + 0.0001
    return { minLat, maxLat, minLng, maxLng, minAlt, maxAlt }
  }, [waypoints])

  useEffect(() => {
    if (!containerRef.current) return
  }, [])

  const project = (lat: number, lng: number, alt: number, width: number, height: number) => {
    const nx = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)
    const ny = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)
    const nz = (alt - bounds.minAlt) / (bounds.maxAlt - bounds.minAlt)
    const px = nx * width
    const py = ny * height
    const zScale = 120
    const isoX = px + nz * 0.6 * zScale
    const isoY = py - nz * 1.0 * zScale
    return { x: isoX, y: isoY }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-background to-muted">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {waypoints.length > 1 && (
          <polyline
            points={waypoints
              .map((w) => {
                const r = containerRef.current?.getBoundingClientRect()
                const width = r?.width || 800
                const height = r?.height || 400
                const p = project(w.lat, w.lng, w.altitude, width, height)
                return `${p.x},${p.y}`
              })
              .join(" ")}
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="3"
          />
        )}
        {waypoints.map((w, i) => {
          const r = containerRef.current?.getBoundingClientRect()
          const width = r?.width || 800
          const height = r?.height || 400
          const p = project(w.lat, w.lng, w.altitude, width, height)
          return (
            <g key={w.id}>
              <circle cx={p.x} cy={p.y} r={8} fill="hsl(var(--primary))" />
              <text x={p.x + 10} y={p.y - 8} className="fill-foreground" fontSize={10}>
                {i + 1}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded z-10">3D View</div>
    </div>
  )
}
