import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const OPENSKY_BASE = "https://opensky-network.org/api/states/all"

/**
 * Proxy OpenSky Network REST API to avoid CORS restrictions.
 * GET /api/airspace?lamin=37.7&lomin=-122.5&lamax=37.9&lomax=-122.3
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lamin = searchParams.get("lamin")
  const lomin = searchParams.get("lomin")
  const lamax = searchParams.get("lamax")
  const lomax = searchParams.get("lomax")

  if (!lamin || !lomin || !lamax || !lomax) {
    return NextResponse.json(
      { error: "Missing bounding box parameters: lamin, lomin, lamax, lomax" },
      { status: 400 }
    )
  }

  try {
    const url = `${OPENSKY_BASE}?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`

    const res = await fetch(url, {
      // OpenSky rate-limits anonymous requests; 15 s cache aligns with our poll interval
      next: { revalidate: 14 },
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8_000),
    })

    if (!res.ok) {
      // Rate-limited or server error — return empty gracefully
      return NextResponse.json({ states: [] })
    }

    const raw = await res.json()

    // OpenSky response: { time, states: [[icao24, callsign, ...], ...] }
    const rawStates: unknown[][] = raw.states ?? []

    const states = rawStates
      .filter((s) => s[5] != null && s[6] != null)  // must have lat/lng
      .map((s) => ({
        icao24:        s[0] as string,
        callsign:      ((s[1] as string) ?? "").trim(),
        lat:           s[6] as number,
        lng:           s[5] as number,
        baro_altitude: (s[7] as number) ?? 0,
        velocity:      (s[9] as number) ?? 0,
        true_track:    (s[10] as number) ?? 0,
        on_ground:     (s[8] as boolean) ?? false,
      }))

    return NextResponse.json({ states })
  } catch {
    // Network error or timeout — return empty so map keeps working
    return NextResponse.json({ states: [] })
  }
}
