"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

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
}

export function MapView({
  waypoints,
  selectedWaypoint,
  onWaypointClick,
  onMapClick,
  center = [37.7749, -122.4194],
  zoom = 13,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mapCenter, setMapCenter] = useState(center)
  const [mapZoom, setMapZoom] = useState(zoom)

  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        setMapSize({
          width: containerRef.current?.clientWidth || 0,
          height: containerRef.current?.clientHeight || 0,
        })
      }
      updateSize()
      window.addEventListener("resize", updateSize)
      return () => window.removeEventListener("resize", updateSize)
    }
  }, [])

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = (lat: number, lng: number) => {
    const scale = Math.pow(2, mapZoom)
    const worldWidth = 256 * scale
    const worldHeight = 256 * scale

    const x = ((lng + 180) / 360) * worldWidth
    const latRad = (lat * Math.PI) / 180
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
    const y = worldHeight / 2 - (worldWidth * mercN) / (2 * Math.PI)

    const centerX = ((mapCenter[1] + 180) / 360) * worldWidth
    const centerLatRad = (mapCenter[0] * Math.PI) / 180
    const centerMercN = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2))
    const centerY = worldHeight / 2 - (worldWidth * centerMercN) / (2 * Math.PI)

    return {
      x: x - centerX + mapSize.width / 2,
      y: y - centerY + mapSize.height / 2,
    }
  }

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    const scale = Math.pow(2, mapZoom)
    const worldWidth = 256 * scale
    const worldHeight = 256 * scale

    const centerX = ((mapCenter[1] + 180) / 360) * worldWidth
    const centerLatRad = (mapCenter[0] * Math.PI) / 180
    const centerMercN = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2))
    const centerY = worldHeight / 2 - (worldWidth * centerMercN) / (2 * Math.PI)

    const worldX = x - mapSize.width / 2 + centerX
    const worldY = y - mapSize.height / 2 + centerY

    const lng = (worldX / worldWidth) * 360 - 180
    const mercN = (worldHeight / 2 - worldY) * ((2 * Math.PI) / worldWidth)
    const latRad = 2 * Math.atan(Math.exp(mercN)) - Math.PI / 2
    const lat = (latRad * 180) / Math.PI

    return { lat, lng }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    const scale = Math.pow(2, mapZoom)
    const worldWidth = 256 * scale

    const dLng = -(dx / worldWidth) * 360
    const dLat = (dy / worldWidth) * 360 * 0.5

    setMapCenter([mapCenter[0] + dLat, mapCenter[1] + dLng])
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on a waypoint
    let clickedWaypoint = false
    for (const waypoint of waypoints) {
      const pos = latLngToPixel(waypoint.lat, waypoint.lng)
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2))
      if (distance < 20) {
        onWaypointClick(waypoint.id)
        clickedWaypoint = true
        break
      }
    }

    // If no waypoint clicked, add new waypoint
    if (!clickedWaypoint && onMapClick) {
      const { lat, lng } = pixelToLatLng(x, y)
      onMapClick(lat, lng)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    setMapZoom(Math.max(3, Math.min(18, mapZoom + delta)))
  }

  // Calculate tile coordinates for the current view
  const getTileUrl = (x: number, y: number, z: number) => {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  }

  const tileSize = 256
  const scale = Math.pow(2, mapZoom)
  const centerTileX = Math.floor(((mapCenter[1] + 180) / 360) * scale)
  const centerTileY = Math.floor(
    ((1 - Math.log(Math.tan((mapCenter[0] * Math.PI) / 180) + 1 / Math.cos((mapCenter[0] * Math.PI) / 180)) / Math.PI) /
      2) *
      scale,
  )

  const tilesX = Math.ceil(mapSize.width / tileSize) + 2
  const tilesY = Math.ceil(mapSize.height / tileSize) + 2

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-muted rounded-lg cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      {/* Map tiles */}
      <div className="absolute inset-0">
        {Array.from({ length: tilesY }).map((_, ty) =>
          Array.from({ length: tilesX }).map((_, tx) => {
            const tileX = centerTileX + tx - Math.floor(tilesX / 2)
            const tileY = centerTileY + ty - Math.floor(tilesY / 2)

            const centerPixel = latLngToPixel(mapCenter[0], mapCenter[1])
            const left = mapSize.width / 2 - centerPixel.x + tileX * tileSize
            const top = mapSize.height / 2 - centerPixel.y + tileY * tileSize

            return (
              <img
                key={`${tileX}-${tileY}`}
                src={getTileUrl(tileX, tileY, mapZoom) || "/placeholder.svg"}
                alt=""
                className="absolute pointer-events-none"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                }}
              />
            )
          }),
        )}
      </div>

      {/* Waypoint path */}
      {waypoints.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <polyline
            points={waypoints
              .map((wp) => {
                const pos = latLngToPixel(wp.lat, wp.lng)
                return `${pos.x},${pos.y}`
              })
              .join(" ")}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="10,10"
            opacity="0.7"
          />
        </svg>
      )}

      {/* Waypoint markers */}
      {waypoints.map((waypoint, index) => {
        const pos = latLngToPixel(waypoint.lat, waypoint.lng)
        const isSelected = selectedWaypoint === waypoint.id

        return (
          <div
            key={waypoint.id}
            className="absolute pointer-events-none"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: isSelected ? 3 : 2,
            }}
          >
            <div
              className={`flex items-center justify-center rounded-full font-bold text-sm transition-all ${
                isSelected
                  ? "w-10 h-10 bg-primary text-primary-foreground ring-4 ring-primary/30"
                  : "w-8 h-8 bg-primary/80 text-primary-foreground"
              }`}
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {index + 1}
            </div>
          </div>
        )
      })}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setMapZoom(Math.min(18, mapZoom + 1))
          }}
        >
          +
        </button>
        <button
          className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setMapZoom(Math.max(3, mapZoom - 1))
          }}
        >
          −
        </button>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded z-10">
        © OpenStreetMap
      </div>
    </div>
  )
}
