"use client"

import React, { useEffect, useState, useRef } from "react"
import { Viewer, Entity, CameraFlyTo, PolylineGraphics, PointGraphics, ModelGraphics } from "resium"
import * as Cesium from "cesium"

// Point Cesium directly to CDN to avoid complex Webpack/Next.js asset copying
if (typeof window !== "undefined") {
  (window as any).CESIUM_BASE_URL = "https://unpkg.com/cesium@1.114.0/Build/Cesium/";
}

interface Waypoint {
  id: string
  lat: number
  lng: number
  altitude: number
  action: string
  speed?: number
}

interface MapView3DProps {
  waypoints: Waypoint[]
}

export function MapView3D({ waypoints }: MapView3DProps) {
  const [mounted, setMounted] = useState(false)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const [trackedEntity, setTrackedEntity] = useState<Cesium.Entity | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Identify Drone Position (Action="current" or first point)
  const droneWp = waypoints.find(w => w.action === "current")
  const dronePosition = droneWp
    ? Cesium.Cartesian3.fromDegrees(droneWp.lng, droneWp.lat, droneWp.altitude)
    : (waypoints.length > 0 ? Cesium.Cartesian3.fromDegrees(waypoints[0].lng, waypoints[0].lat, waypoints[0].altitude) : undefined)

  // Auto-track drone when found
  useEffect(() => {
    if (viewerRef.current && droneWp) {
      // Give Cesium a moment to register the entity
      const interval = setInterval(() => {
        const entity = viewerRef.current?.entities.getById("drone-entity")
        if (entity) {
          setTrackedEntity(entity)
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [droneWp])

  if (!mounted) return <div className="w-full h-full bg-black/90 flex items-center justify-center">Loading 3D Engine...</div>

  // Calculate center... (rest of codes)
  const center = waypoints.length > 0
    ? Cesium.Cartesian3.fromDegrees(waypoints[0].lng, waypoints[0].lat, 500)
    : Cesium.Cartesian3.fromDegrees(-122.4194, 37.7749, 1000)

  // Convert waypoints... (rest of codes)
  const flightPath = waypoints.filter(w => w.action !== 'current').map(w =>
    Cesium.Cartesian3.fromDegrees(w.lng, w.lat, w.altitude)
  )

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-white/10">
      <Viewer
        full
        timeline={false}
        animation={false}
        navigationHelpButton={false}
        homeButton={false}
        geocoder={false}
        baseLayerPicker={false}
        sceneModePicker={false}
        infoBox={false}
        selectionIndicator={false}
        className="w-full h-full"
        ref={(e) => { if (e && e.cesiumElement) viewerRef.current = e.cesiumElement }}
        trackedEntity={trackedEntity}
      >
        {/* Terrain and Init Camera... */}
        {!trackedEntity && <CameraFlyTo destination={center} duration={2} />}

        {/* Flight Path... */}
        {flightPath.length > 1 && (
          <Entity>
            <PolylineGraphics
              positions={flightPath}
              width={3}
              material={Cesium.Color.CYAN.withAlpha(0.7)}
            />
          </Entity>
        )}

        {/* Waypoints... */}
        {waypoints.filter(w => w.action !== 'current').map((w, i) => (
          <Entity
            key={w.id}
            position={Cesium.Cartesian3.fromDegrees(w.lng, w.lat, w.altitude)}
            name={`Waypoint ${i + 1}`}
            description={`Action: ${w.action}`}
          >
            <PointGraphics pixelSize={10} color={Cesium.Color.YELLOW} outlineColor={Cesium.Color.BLACK} outlineWidth={2} />
          </Entity>
        ))}

        {/* DRONE ENTITY */}
        {droneWp && (
          <Entity
            id="drone-entity"
            position={dronePosition}
            name="Active Drone"
          >
            <PointGraphics pixelSize={15} color={Cesium.Color.CYAN} outlineColor={Cesium.Color.WHITE} outlineWidth={2} />
            <ModelGraphics
              uri="/drone.glb"
              minimumPixelSize={64}
              maximumScale={20000}
            />
          </Entity>
        )}
      </Viewer>
    </div>
  )
}
