<div align="center">

<img src="./public/jawji-logo.png" alt="JAWJI" width="120"/>

# JAWJI Ground Control Station (GCS)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Auth](https://img.shields.io/badge/Auth-NextAuth.js-2E3440)](https://next-auth.js.org/)
[![UI](https://img.shields.io/badge/UI-shadcn%2Fui-000000)](https://ui.shadcn.com/)
[![State](https://img.shields.io/badge/State-Zustand-764ABC)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

</div>

## Overview

JAWJI GCS is an AI-powered, GPS-free autonomous drone control platform. It provides:

- Mission Planning with a multi-step wizard, validation, and geofencing
- Flight Operations dashboard and manual control
- Fleet Management with rich drone metadata
- Pre-flight checklist linked to mission plans
- OAuth login via Google/GitHub using NextAuth

## Features

- **Mission Planning**: 5-step wizard (Basics, Vehicle & Payload, Flight Profile, Safety & Compliance, Review) with zod validation and geofence input.
- **Mission Library**: Manage, search, duplicate, delete, and run pre-flight per mission.
- **Fleet Management**: Full-page directory, Add/Edit drones (status, mode, battery, signal, location).
- **Auth & Session**: NextAuth session across app, StatusBar user display, real sign out.
- **Persistence**: Zustand stores with persist for missions and drones.
- **PWA/Telemetry hooks**: Bootstraps for analytics and PWA service worker.

## Tech Stack

- Next.js App Router, TypeScript, shadcn/ui, TailwindCSS, Zustand, NextAuth, zod

## Quickstart

1. Install dependencies

```bash
npm install
```

2. Environment variables: create `.env.local`

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GITHUB_ID=...
GITHUB_SECRET=...
```

3. OAuth console callbacks

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

4. Dev server

```bash
npm run dev
```

### Ingest Endpoint Configuration

Add the following environment variables to `.env.local` if you plan to POST telemetry to `/api/ingest`:

```bash
# Optional bearer or x-api-key token required by /api/ingest
INGEST_TOKEN=your_secure_random_token

# CORS origin allowed to call /api/ingest (default: *)
INGEST_CORS_ORIGIN=*

# Optional: absolute path to an external MQTT streamer module
# The module should export one of: ingest, publish, send, or default (function)
# Example (Windows): C:\Users\UtachiCodes\Documents\JAWJI\mqtt-streamer\mqtt-streamer\dist\index.js
STREAMER_MODULE_PATH=
```

### Live Telemetry to UI

- POST your telemetry to `/api/ingest` with `Authorization: Bearer $INGEST_TOKEN` and JSON body.
- The server broadcasts it over an SSE stream at `/api/telemetry/stream`.
- The client subscribes and updates the drone store in real time (`components/telemetry-bootstrap.tsx`).

Example (PowerShell):

```powershell
curl -Method POST http://localhost:3000/api/ingest `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:INGEST_TOKEN" `
  -Body '{"droneId":"drone-1","battery":86,"signal":95,"location":{"lat":37.7749,"lng":-122.4194,"altitude":46.0}}'
```

### Live Camera Feed

- The unified dashboard will render real video when a telemetry message includes `videoUrl`, `streamUrl`, or `metadata.camera.streamUrl`.
- Configure a fallback stream for development by setting `NEXT_PUBLIC_DEFAULT_VIDEO_STREAM=https://your-cdn/live/drone.m3u8` in `.env.local`.
- Sample payload:
  ```json
  {
    "droneId": "jawji-001",
    "battery": 86,
    "signal": 95,
    "location": { "lat": 37.7749, "lng": -122.4194, "altitude": 46.0 },
    "videoUrl": "https://cdn.example.com/live/jawji-001.m3u8"
  }
  ```
- When no feed is present the UI shows an “Awaiting live feed” placeholder instead of simulated imagery.

## Map Library Choice (Geofence & Waypoints)

We will integrate **Leaflet + leaflet-draw** for geofence/waypoint editing.

- **Why Leaflet**
  - Lightweight, OSS, no API key required
  - Mature ecosystem; easy polygon/marker drawing via `leaflet-draw`
  - Flexible CRS and offline tile options if needed later

- **Packages**

```bash
npm install leaflet leaflet-draw
```

- **Integration Plan**
  - Replace `components/map-geofence.tsx` placeholder with a Leaflet map.
  - Load base tiles (e.g., OSM) and enable draw controls (polygon).
  - Serialize polygons to GeoJSON and store on the mission (`geofence` as GeoJSON string).
  - Optional: add waypoint markers and export an ordered list for the mission.

## Key Paths

- `app/layout.tsx` — App shell, SessionProvider, theme, analytics, PWA bootstrap
- `components/mission-wizard.tsx` — Mission creation flow with zod validation
- `components/mission-library.tsx` — Library UI and actions (Pre-flight button)
- `lib/mission-store.ts` — Mission store with persistence
- `components/fleet-view.tsx` — Fleet management full-screen view
- `lib/drone-store.ts` — Drone store with persistence
- `app/preflight/page.tsx` & `components/pre-flight-checklist.tsx` — Pre-flight

## Roadmap

- Integrate Leaflet + `leaflet-draw` and store GeoJSON geofences/waypoints
- Enforce drone capability constraints (altitude/speed) in wizard
- Mission import/export endpoints; backend persistence
- Accessibility passes (keyboard nav, aria-describedby)
- “Load into Control” to pre-fill `/control` from a mission

## License

MIT
