# Dashboard Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove duplicated telemetry widgets and unify colors to CSS theme variables across the flight dashboard.

**Architecture:** Four component files are touched in isolation — no shared state or API changes. Each task is a self-contained edit with a visual verification step. No new files created.

**Tech Stack:** Next.js, React, Tailwind CSS, shadcn/ui

---

### Task 1: Remove duplicate metric strip and map overlays from TacticalView

**Problem:** `tactical-view.tsx` shows ALT/SPD/DIST/SATS in a top strip and Heading/Battery as map overlays — all already shown in the HUD bottom strip and SystemDiagnostics.

**Files:**
- Modify: `components/dashboard/tactical-view.tsx`

**Step 1: Remove the 4-metric strip**

In `TacticalView`, delete this block (lines 21-31):
```tsx
{/* Compact metric strip — 4 cells in a single row */}
<div className="grid grid-cols-4 gap-2 shrink-0">
    <MetricBox label="ALT" value={telemetry.altitude.toFixed(1)} unit="M" />
    <MetricBox label="SPD" value={telemetry.speed.toFixed(1)} unit="M/S" />
    <MetricBox label="DIST" value={telemetry.distance.toFixed(0)} unit="M" />
    <MetricBox
        label="SATS"
        value={String(telemetry.gpsSatellites)}
        unit="SAT"
        color={telemetry.gpsSatellites > 6 ? "text-emerald-500" : "text-orange-500"}
    />
</div>
```

**Step 2: Remove Heading and Battery map overlays**

Delete the Heading overlay block (inside the `Card`):
```tsx
{/* Heading overlay — bottom-left corner */}
<div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 font-mono">
    <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] block leading-none mb-0.5">Heading</span>
    <span className="text-base font-black text-emerald-400 leading-none">{telemetry.heading.toFixed(0)}°</span>
</div>
```

Delete the Battery overlay block (inside the `Card`):
```tsx
{/* Battery overlay — bottom-right corner */}
<div className="absolute bottom-2 right-2 z-20 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 font-mono">
    <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] block leading-none mb-0.5">Battery</span>
    <span className={`text-base font-black leading-none ${telemetry.battery < 20 ? "text-red-400 animate-pulse" : telemetry.battery < 40 ? "text-orange-400" : "text-emerald-400"}`}>
        {telemetry.battery.toFixed(0)}%
    </span>
</div>
```

**Step 3: Delete the now-unused MetricBox component**

The entire `MetricBox` function at the bottom of the file can be removed since nothing uses it after step 1.

**Step 4: Remove unused `telemetry` prop usage check**

After removing the metric strip and overlays, `telemetry` is only used by `MissionProgress` (which it isn't — `MissionProgress` takes no props). Remove `telemetry` from the props destructure and the interface if it's now unused. Check: it's still used in the metric strip if we kept it... but we removed all uses, so:
- Remove `telemetry` from `TacticalViewProps` interface
- Remove `telemetry` from the destructured props in the function signature
- Remove the `telemetry` prop passed from `unified-dashboard.tsx`

**Step 5: Verify visually**
Run `npm run dev` and open the dashboard. The right panel should show only the map (full height) with just the 2D/3D toggle. No duplicate metric boxes, no heading/battery overlays on the map.

**Step 6: Commit**
```bash
git add components/dashboard/tactical-view.tsx components/unified-dashboard.tsx
git commit -m "fix(dashboard): remove duplicate metric strip and map overlays from TacticalView"
```

---

### Task 2: Fix colors in TacticalHUD

**Files:**
- Modify: `components/dashboard/tactical-hud.tsx`

**Step 1: Replace hardcoded emerald/amber/red with theme variables**

In `HudCell`, replace the `cls` logic:

Old:
```tsx
const cls =
    state === "red"
        ? "border-red-500/70 text-red-100"
        : state === "amber"
            ? "border-amber-500/70 text-amber-100"
            : "border-white/15 text-white"
```

New:
```tsx
const cls =
    state === "red"
        ? "border-destructive/70 text-destructive"
        : state === "amber"
            ? "border-amber-500/70 text-amber-400"
            : "border-border/40 text-foreground"
```

**Step 2: Replace the status badge styles**

Old:
```tsx
connected: { label: "CONNECTED", cls: "bg-emerald-500 text-black border-emerald-500" },
warning: { label: "WARNING", cls: "bg-amber-500 text-black border-amber-500" },
disconnected: { label: "DISCONNECTED", cls: "bg-red-600 text-white border-red-500" },
```

New:
```tsx
connected: { label: "CONNECTED", cls: "bg-primary text-primary-foreground border-primary" },
warning: { label: "WARNING", cls: "bg-amber-500 text-black border-amber-500" },
disconnected: { label: "DISCONNECTED", cls: "bg-destructive text-destructive-foreground border-destructive" },
```

**Step 3: Replace the critical battery overlay colors**

Old:
```tsx
<div className="absolute inset-0 bg-red-600/15" />
...
<div className="px-4 py-3 border-2 border-red-500 bg-black/70 text-red-200">
    <AlertTriangle className="h-4 w-4" />
    <span className="text-[12px] font-black tracking-widest">CRITICAL BATTERY</span>
    <div className="mt-1 text-[11px] font-mono font-bold tracking-tight text-white/80">
```

New:
```tsx
<div className="absolute inset-0 bg-destructive/15" />
...
<div className="px-4 py-3 border-2 border-destructive bg-black/70 text-destructive-foreground">
    <AlertTriangle className="h-4 w-4" />
    <span className="text-[12px] font-black tracking-widest">CRITICAL BATTERY</span>
    <div className="mt-1 text-[11px] font-mono font-bold tracking-tight text-muted-foreground">
```

**Step 4: Replace HUD cell backgrounds**

Old: `bg-black/55`
New: `bg-background/60`

**Step 5: Commit**
```bash
git add components/dashboard/tactical-hud.tsx
git commit -m "fix(dashboard): replace hardcoded colors with theme variables in TacticalHUD"
```

---

### Task 3: Fix colors in SystemDiagnostics

**Files:**
- Modify: `components/dashboard/system-diagnostics.tsx`

**Step 1: Replace MetricRow value colors**

The default `color` prop is `"text-emerald-400"`. Change to `"text-primary"`:

Old:
```tsx
function MetricRow({ label, value, color = "text-emerald-400" }: ...
```
New:
```tsx
function MetricRow({ label, value, color = "text-primary" }: ...
```

Also update all `color` overrides in the file:
- `color={telemetry.timeToEmpty < 5 ? "text-red-500" : "text-emerald-400"}` → `color={telemetry.timeToEmpty < 5 ? "text-destructive" : "text-primary"}`
- `color={telemetry.hdop < 2 ? "text-emerald-400" : "text-orange-400"}` → `color={telemetry.hdop < 2 ? "text-primary" : "text-amber-500"}`

**Step 2: Replace battery display colors**

Old:
```tsx
<span className={`text-[10px] font-black font-mono ${telemetry.battery < 20 ? "text-red-500 animate-pulse" : "text-primary"}`}>
```
New:
```tsx
<span className={`text-[10px] font-black font-mono ${telemetry.battery < 20 ? "text-destructive animate-pulse" : "text-primary"}`}>
```

**Step 3: Replace motor bar color**

Old: `className="w-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] ..."`
New: `className="w-full bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)] ..."`

Also update the glow color: `shadow-[0_0_15px_rgba(16,185,129,0.4)]` → `shadow-[0_0_12px_hsl(var(--primary)/0.35)]`

**Step 4: Replace label colors**

Replace `text-white/40` and `text-white/60` on section headers with `text-muted-foreground`:
- In Power System, Navigation, Atmospherics, Motor Status section headers: change `text-white/60` → `text-muted-foreground`
- `text-white/30` on `MetricRow` label span → `text-muted-foreground`

**Step 5: Replace emerald status text in DiagSection**

Old: `<span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">{status}</span>`
New: `<span className="text-[8px] font-black tracking-widest text-primary uppercase">{status}</span>`

**Step 6: Commit**
```bash
git add components/dashboard/system-diagnostics.tsx
git commit -m "fix(dashboard): replace hardcoded colors with theme variables in SystemDiagnostics"
```

---

### Task 4: Fix colors in ControlBar

**Files:**
- Modify: `components/dashboard/control-bar.tsx`

**Step 1: Differentiate TAKEOFF vs RTH button colors**

TAKEOFF should stay as the prominent "go" action. RTH (Return to Home) is a secondary recovery action — give it a neutral border to distinguish priority:

Old RTH button classes:
```tsx
className="h-full min-h-0 rounded-md px-4 flex flex-col items-start justify-center border-2 border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 text-foreground active:translate-y-px"
```

New RTH button classes:
```tsx
className="h-full min-h-0 rounded-md px-4 flex flex-col items-start justify-center border-2 border-border/80 bg-muted/10 hover:bg-muted/20 text-foreground active:translate-y-px"
```

**Step 2: Replace TAKEOFF emerald with primary**

Old TAKEOFF:
```tsx
className="... border-emerald-500/70 bg-emerald-500/20 hover:bg-emerald-500/30 ..."
```
New TAKEOFF:
```tsx
className="... border-primary/70 bg-primary/20 hover:bg-primary/30 ..."
```

**Step 3: Commit**
```bash
git add components/dashboard/control-bar.tsx
git commit -m "fix(dashboard): unify control bar button colors with theme, differentiate RTH priority"
```

---

### Final verification

Run `npm run dev`. Check:
1. Right panel: map fills full height, no metric strip on top, no overlays on map corners
2. HUD cells: border/text colors use theme (look correct in both light and dark mode)
3. SystemDiagnostics: motor bars and value text use primary color
4. ControlBar: TAKEOFF is primary-colored, RTH is neutral, LAND is neutral, ABORT is red
