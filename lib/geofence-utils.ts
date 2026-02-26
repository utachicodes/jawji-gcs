/**
 * Geofence enforcement utilities.
 * Uses ray-casting algorithm for point-in-polygon tests.
 * GeoJSON coordinate order: [longitude, latitude]
 */

/**
 * Ray-casting point-in-polygon.
 * @param lat  WGS-84 latitude
 * @param lng  WGS-84 longitude
 * @param ring Array of [lng, lat] coordinate pairs (GeoJSON order)
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  ring: [number, number][]
): boolean {
  if (ring.length < 3) return false

  let inside = false
  const x = lng
  const y = lat
  const n = ring.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Parse a GeoJSON string and return the first polygon's exterior ring.
 * Handles both Feature and FeatureCollection wrappings.
 * Returns null if the GeoJSON has no polygon geometry.
 */
export function geojsonToRing(geojson: string): [number, number][] | null {
  if (!geojson) return null

  try {
    const obj = JSON.parse(geojson)

    // Unwrap FeatureCollection
    let geometry = obj
    if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
      geometry = obj.features[0]
    }
    // Unwrap Feature
    if (geometry?.type === "Feature") {
      geometry = geometry.geometry
    }

    if (!geometry) return null

    if (geometry.type === "Polygon") {
      return geometry.coordinates[0] as [number, number][]
    }

    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates[0][0] as [number, number][]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Validate a list of waypoints against a GeoJSON geofence.
 *
 * @param waypoints       Array of { lat, lng } objects
 * @param geofenceGeoJSON Raw GeoJSON string (empty/null = no geofence)
 * @returns Indices of waypoints that are OUTSIDE the geofence.
 *          Empty array means all inside, or no geofence defined.
 */
export function validateWaypoints(
  waypoints: { lat: number; lng: number }[],
  geofenceGeoJSON: string | null | undefined
): number[] {
  if (!geofenceGeoJSON) return []

  const ring = geojsonToRing(geofenceGeoJSON)
  if (!ring || ring.length < 3) return []

  const violations: number[] = []
  waypoints.forEach((wp, idx) => {
    if (!pointInPolygon(wp.lat, wp.lng, ring)) {
      violations.push(idx)
    }
  })

  return violations
}
