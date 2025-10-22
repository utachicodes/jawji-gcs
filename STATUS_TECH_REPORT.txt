JAWJI Autonomous Drone Ground Station - Technical Overview & Status

A modern, operator-focused Ground Control Station (GCS) built with Next.js and a clean, extensible architecture. It targets pro-grade reliability and UX, with mission planning, flight operations, manual control with safety guardrails, geofencing, and a path to real telemetry/video integration.

Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Zustand
Focus: Operational safety, responsive UI, enterprise readiness
Status: Core UI and flows implemented; awaiting ROS bag from Babacar for live telemetry integration; actively developing the computer vision model for drone detection

---

Table of Contents
- Overview
- Architecture
- Key Features Implemented
- UI/UX Highlights
- Telemetry & Data
- Mission Planning & Geofencing
- Manual Control & Safety
- Settings & Persistence
- Computer Vision (WIP)
- Roadmap / What’s Next
- Setup & Run
- Project Structure
- Contributing
- License

---

Overview
This GCS aims to surpass existing solutions in clarity and safety for autonomous drone operations. It provides:
- A polished Flight Operations dashboard with HUD overlays and reliable map/video panel sizing
- Mission planning with waypoint editing and geofencing
- Manual control with interlocks and confirmation dialogs for critical actions
- Settings with import/export and user feedback toasts
- A telemetry abstraction ready to bind to ROS bag playback or live endpoints

---

Architecture
[UI (Next.js)] -> [Zustand Stores] -> [Components]
Components -> lib/telemetry.ts (mock now, ROS/WebSocket later)
Components -> lib/mission-store.ts (persisted missions)
Components -> lib/drone-store.ts (fleet state)

- UI built with Next.js App Router and shadcn/ui components.
- State managed with Zustand stores for missions and drones.
- Telemetry abstracted via a simple "bus" interface that can be swapped for real sources.
- Visuals use TailwindCSS with a theme tuned for dark mode operations.

---

Key Features Implemented
- Flight Operations Dashboard (components/unified-dashboard.tsx)
  - HUD overlays (mode, GPS, altitude, speed, heading, timers)
  - Reliable panel sizing with flex and min-height guards
  - 2D Leaflet map and isometric 3D path preview (components/map-view.tsx, components/map-view-3d.tsx)
  - Mock telemetry adapter subscribed in real time

- Mission Planning (components/mission-planning.tsx)
  - On-map waypoint add/drag and list editor
  - Distance/time estimates and mission save/start
  - Geofence tab to draw polygon and save GeoJSON

- Manual Control (components/drone-control.tsx)
  - Virtual joysticks visualization and gamepad mapping
  - Safety confirmations for Arm/Disarm/Takeoff/Land/RTL
  - Toast feedback for operator clarity

- Settings (components/settings.tsx)
  - Local persistence of profile and preferences
  - Import/Export/Reset with toasts
  - Camera/System tabs

- Navigation (components/app-sidebar.tsx)
  - Clean, minimal sidebar with smooth interactions
  - Branding removed from the sidebar per design choice (header carries brand)

---

UI/UX Highlights
- Glassy HUD with subtle blur (backdrop-blur-sm) and consistent borders for readability on video
- Safe min-height guards for map/video to prevent zero-height rendering
- Skeleton loading for dashboard while module loads (app/dashboard/page.tsx)
- Consistent transitions/focus rings for polished interactions
- Dark-first theme tuned for low-light operations (app/globals.css)

---

Telemetry & Data
- Mock Telemetry Bus (lib/telemetry.ts)
  - Produces a continuous stream of Telemetry updates (altitude, speed, heading, GPS, flight time, battery, signal)
  - Simple subscribe/unsubscribe API; easy to replace with ROS/WebSocket/SSE
- Dashboard Integration (components/unified-dashboard.tsx)
  - Subscribes to telemetry bus in useEffect() and updates HUD/Map
  - Ready to swap createMockTelemetry() for a real source

Planned integration when ROS bag is available:
- A createRosTelemetry() that replays telemetry from a bag (or forwards via WebSocket)
- Matching the Telemetry type for plug-and-play replacement

---

Mission Planning & Geofencing
- Waypoints:
  - Map click to add, drag to reposition, list editor for lat/lng/alt/speed/action
  - Distance/time calculations for quick planning sanity checks
- Geofence (components/map-geofence.tsx):
  - Leaflet-draw polygon tool integrated into a dedicated Geofence tab
  - GeoJSON persisted into mission records via useMissionStore (lib/mission-store.ts)

---

Manual Control & Safety
- Confirmations & Interlocks:
  - Arm/Disarm/Takeoff/Land/Return-to-Home require user confirmation
  - Toasts for action feedback
- Virtual Joysticks:
  - Visual feedback and logged values for loops
  - Gamepad axis mapping stubbed for future control middleware

---

Settings & Persistence
- Settings (components/settings.tsx)
  - Profile and preferences persisted to localStorage
  - Import/export JSON configuration and reset defaults
  - Sonner toasts for success feedback
- Missions (lib/mission-store.ts)
  - Zustand + persist for mission records, including waypointData and optional geofence

---

Computer Vision (WIP)
- Building a CV model for drone detection to power:
  - Visual/thermal detection overlays in the Flight Ops panel
  - Target tracking and alerting for safety and security applications
- Planned steps:
  - Dataset curation and labeling
  - Baseline model training (e.g., YOLO family or Detectron2)
  - Real-time inference pipeline integration with video source and HUD overlay
  - Operator alerts and confirmable actions based on detections

---

Roadmap / What’s Next
- Awaiting Data:
  - ROS bag from Babacar to wire real data sources into the telemetry bus and validate mission playback

- Telemetry & Video:
  - WebSocket/SSE telemetry adapter with reconnection/resilience
  - Video pipeline: WebRTC (ultra-low latency) or HLS (simpler), with network stats overlay (jitter/latency/loss/bitrate)

- Safety & Mission Guardrails:
  - Preflight checklist/approvals before enabling Takeoff/RTL
  - Geofence breach detection and failsafe flows
  - Battery thresholds tied to auto-land or return-to-home

- Enterprise Features:
  - Role-based access control (Admin/Pilot/Observer)
  - Audit logs for operations and control actions
  - Mission templates, approvals, and replay

- Computer Vision Integration:
  - Real-time inference path and overlay integration
  - Accuracy and latency benchmarks in field tests

---

Setup & Run
Prerequisites: Node.js LTS, npm

npm install
npm run dev
# Visit http://localhost:3000

No required environment variables for the current mock setup. When adding real telemetry/video endpoints, a .env.local will be introduced.

---

Project Structure
- app/
  - dashboard/page.tsx – Flight Operations entry (dynamic load with skeleton)
  - layout.tsx – App wrapper, providers, theming
- components/
  - unified-dashboard.tsx – Main dashboard with HUD and map
  - map-view.tsx, map-view-3d.tsx – 2D/3D map views
  - mission-planning.tsx – Mission planner + geofence tab
  - map-geofence.tsx – Leaflet-draw polygon editor
  - drone-control.tsx – Manual control with confirmations
  - settings.tsx – Config and preferences with toasts
  - app-sidebar.tsx, app-layout.tsx – Navigation/layout
- lib/
  - telemetry.ts – Mock telemetry bus and Telemetry type
  - mission-store.ts – Missions store with persistence
  - drone-store.ts – Fleet state
- app/globals.css – Tailwind theme tokens and layers

---

Contributing
- Use descriptive commits and keep changes scoped.
- Favor small, backwards-compatible increments.
- When integrating real data (ROS/WebSocket), keep the Telemetry interface stable.

---

License
- Project licensing to be defined by the repository owner.

---

Appendix: Relevant Files and Paths
- components/unified-dashboard.tsx — HUD, map/video layout, telemetry subscription
- lib/telemetry.ts — Telemetry bus (mock now; swap for ROS/WebSocket later)
- components/mission-planning.tsx — Waypoints + geofence tab and persistence
- components/map-geofence.tsx — Polygon drawing with GeoJSON
- components/drone-control.tsx — Confirm dialogs for critical actions
- components/settings.tsx — Import/export/toasts for app settings
- components/app-sidebar.tsx — Minimal sidebar with transitions
- app/globals.css — Theming for consistency across dark/light
