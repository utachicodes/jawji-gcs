# Dashboard Polish — Market-Ready Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all layout, visual, and polish issues in the flight dashboard to make it market-ready at 100% browser zoom.

**Architecture:** Four targeted changes across six files — grid proportions, video placeholder, wind vector colors, sidebar formatting. No new components, no architectural changes. Pure polish.

**Tech Stack:** Next.js 15, React, Tailwind CSS, shadcn/ui

---

### Task 1: Fix UnifiedDashboard grid proportions and simplify layout

**Problem:** `col-span-2/6/4` makes the left panel only ~167px wide (data overflows) and the center ~50% wide (mostly empty when disconnected). The `grid-rows-12 row-span-12` pattern is redundant and may cause height issues.

**Files:**
- Modify: `components/unified-dashboard.tsx`

**Step 1: Change the main grid — remove row constraints**

Find this line:
```tsx
<div className="flex-1 grid grid-cols-12 grid-rows-12 gap-3 min-h-0 relative z-10 overflow-hidden">
```
Change to:
```tsx
<div className="flex-1 grid grid-cols-12 gap-3 min-h-0 relative z-10 overflow-hidden">
```

**Step 2: Fix left column proportions**

Find:
```tsx
<div className="col-span-12 row-span-4 lg:col-span-2 lg:row-span-12 h-full overflow-hidden">
```
Change to:
```tsx
<div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
```

**Step 3: Fix center column proportions**

Find:
```tsx
<div className="col-span-12 row-span-8 lg:col-span-6 lg:row-span-12 h-full overflow-hidden flex flex-col border border-border/40 rounded-xl bg-black/20">
```
Change to:
```tsx
<div className="col-span-12 lg:col-span-5 h-full overflow-hidden flex flex-col border border-border/40 rounded-xl bg-black/20">
```

**Step 4: Fix right column**

Find:
```tsx
<div className="col-span-12 row-span-4 lg:col-span-4 lg:row-span-12 h-full overflow-hidden flex flex-col">
```
Change to:
```tsx
<div className="col-span-12 lg:col-span-4 h-full overflow-hidden flex flex-col">
```

**Step 5: TypeScript check**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npx tsc --noEmit 2>&1 | head -20
```
Only pre-existing `lib/influxdb-adapter.ts` error expected.

**Step 6: Commit**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && git add components/unified-dashboard.tsx && git commit -m "fix(dashboard): fix grid proportions col-span-3/5/4, remove redundant row-span constraints"
```

---

### Task 2: Replace WebRTC player disconnected state — "LINK LOST" placeholder

**Problem:** When disconnected with no stream URL, `webrtc-player.tsx` renders a plain red "LINK LOST" badge floating in a black void. This looks broken. The entire HUD center area (50% of screen width) just shows empty black with a small red text box. Need a proper full-panel placeholder.

**Files:**
- Modify: `components/webrtc-player.tsx`

**Step 1: Replace the disconnected state render**

Find this entire block (lines 89–98):
```tsx
if (!effectiveUrl) {
    if (connectionState === "disconnected") {
        return (
            <div className={`bg-black ${className} flex items-center justify-center`}>
                <div className="px-3 py-2 border border-red-500/60 bg-red-600/20 text-red-200 text-[11px] font-mono font-bold tracking-widest">
                    LINK LOST
                </div>
            </div>
        )
    }
```

Replace with:
```tsx
if (!effectiveUrl) {
    if (connectionState === "disconnected") {
        return (
            <div className={`bg-zinc-950 ${className} flex items-center justify-center relative overflow-hidden`}>
                {/* Subtle scanline grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
                {/* Center content */}
                <div className="relative z-10 flex flex-col items-center gap-4 select-none">
                    {/* Drone silhouette icon */}
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-20">
                        <circle cx="14" cy="14" r="7" stroke="white" strokeWidth="1.5" />
                        <circle cx="50" cy="14" r="7" stroke="white" strokeWidth="1.5" />
                        <circle cx="14" cy="50" r="7" stroke="white" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="7" stroke="white" strokeWidth="1.5" />
                        <line x1="19" y1="19" x2="28" y2="28" stroke="white" strokeWidth="1.5" />
                        <line x1="45" y1="19" x2="36" y2="28" stroke="white" strokeWidth="1.5" />
                        <line x1="19" y1="45" x2="28" y2="36" stroke="white" strokeWidth="1.5" />
                        <line x1="45" y1="45" x2="36" y2="36" stroke="white" strokeWidth="1.5" />
                        <rect x="26" y="26" width="12" height="12" rx="2" stroke="white" strokeWidth="1.5" />
                    </svg>
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-black font-mono tracking-[0.3em] text-white/20 uppercase">No Video Signal</span>
                        <span className="text-[9px] font-mono text-white/10 tracking-widest uppercase">Connect a drone to view feed</span>
                    </div>
                </div>
            </div>
        )
    }
```

**Step 2: Fix remaining `bg-black` on camera-acquisition state**

Find (line ~109):
```tsx
return (
    <div className={`relative bg-black ${className} overflow-hidden`}>
```
Change `bg-black` to `bg-zinc-950`:
```tsx
return (
    <div className={`relative bg-zinc-950 ${className} overflow-hidden`}>
```

Find (line ~102):
```tsx
<div className={`bg-black flex items-center justify-center text-muted-foreground text-xs ${className}`}>
```
Change `bg-black` to `bg-zinc-950`:
```tsx
<div className={`bg-zinc-950 flex items-center justify-center text-muted-foreground text-xs ${className}`}>
```

Also fix lines ~139, ~161 (YouTube and fallback video wrappers):
```tsx
// Both currently: className={`relative bg-black ${className} overflow-hidden ...`}
// Change bg-black → bg-zinc-950 in both
```

**Step 3: Clean up the duplicate comment on line 134–135**

Delete this duplicate comment:
```tsx
// Check if it's a YouTube URL
// const isYouTube = url.includes("youtube.com") || url.includes("youtu.be") - Removed duplicate
```
It's dead code with no value.

**Step 4: TypeScript check**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && git add components/webrtc-player.tsx && git commit -m "fix(video): replace LINK LOST placeholder with proper disconnected state, bg-zinc-950 throughout"
```

---

### Task 3: Fix WindVector hardcoded colors

**Problem:** `wind-vector.tsx` was missed in the previous color cleanup pass. It still uses `bg-emerald-500`, `text-emerald-400`, `bg-black/20`, `border-white/5`, `text-white/30`, `text-white/50`.

**Files:**
- Modify: `components/dashboard/wind-vector.tsx`

Here is the FULL current file content for reference:
```tsx
"use client"

import { Wind } from "lucide-react"

interface WindVectorProps {
    speed: number
    direction: number
    className?: string
}

export function WindVector({ speed, direction, className }: WindVectorProps) {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <div className="relative h-12 w-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-white/5 bg-black/20" />
                <div className="absolute inset-1 rounded-full border border-white/5" />
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${direction}deg)` }}
                >
                    <div className="h-[70%] w-0.5 bg-emerald-500 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-emerald-500" />
                    </div>
                </div>
                <div className="relative z-10 bg-black/40 px-1 rounded-sm border border-white/10">
                    <span className="text-[8px] font-black text-emerald-400">{speed.toFixed(1)}</span>
                </div>
            </div>
            <div className="flex flex-col items-center -mt-1">
                <span className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em]">Wind Vector</span>
                <span className="text-[8px] font-bold text-white/50">{direction.toFixed(0)}°</span>
            </div>
        </div>
    )
}
```

**Step 1: Replace all hardcoded colors**

Write the complete replacement for the file:
```tsx
"use client"

interface WindVectorProps {
    speed: number
    direction: number
    className?: string
}

export function WindVector({ speed, direction, className }: WindVectorProps) {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <div className="relative h-12 w-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-border/20 bg-background/20" />
                <div className="absolute inset-1 rounded-full border border-border/10" />
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${direction}deg)` }}
                >
                    <div className="h-[70%] w-0.5 bg-primary relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-primary" />
                    </div>
                </div>
                <div className="relative z-10 bg-background/60 px-1 rounded-sm border border-border/20">
                    <span className="text-[8px] font-black text-primary">{speed.toFixed(1)}</span>
                </div>
            </div>
            <div className="flex flex-col items-center -mt-1">
                <span className="text-[6px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Wind Vector</span>
                <span className="text-[8px] font-bold text-muted-foreground">{direction.toFixed(0)}°</span>
            </div>
        </div>
    )
}
```

Note: the `Wind` import was unused — it's removed in the replacement.

**Step 2: TypeScript check**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && git add components/dashboard/wind-vector.tsx && git commit -m "fix(dashboard): replace hardcoded colors in WindVector with theme variables"
```

---

### Task 4: Fix sidebar battery/signal decimal overflow

**Problem:** `app-sidebar.tsx` renders `{activeDrone.battery}%` and `{activeDrone.signal}%` directly. The drone store provides these as floats (e.g. `28.534092316666666`), producing a comically long string in the sidebar footer.

**Files:**
- Modify: `components/app-sidebar.tsx`

**Step 1: Fix battery display (line 88)**

Find:
```tsx
<span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden min-w-[2.5rem] text-right">{activeDrone.battery}%</span>
```
Change to:
```tsx
<span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden min-w-[2.5rem] text-right">{Math.round(activeDrone.battery)}%</span>
```

**Step 2: Fix signal display (line 96)**

Find:
```tsx
<span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden min-w-[2.5rem] text-right">{activeDrone.signal}%</span>
```
Change to:
```tsx
<span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden min-w-[2.5rem] text-right">{Math.round(activeDrone.signal)}%</span>
```

**Step 3: Fix progress bar widths** — same issue, the `style={{ width: \`${...}%\` }}` will also produce float px values. Wrap both with `Math.max(0, Math.min(100, Math.round(...)))`:

Battery bar (line 86):
```tsx
// OLD
<div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, activeDrone.battery))}%` }} />
// NEW
<div className="h-full bg-green-500" style={{ width: `${Math.round(Math.max(0, Math.min(100, activeDrone.battery)))}%` }} />
```

Signal bar (line 94):
```tsx
// OLD
<div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, activeDrone.signal))}%` }} />
// NEW
<div className="h-full bg-green-500" style={{ width: `${Math.round(Math.max(0, Math.min(100, activeDrone.signal)))}%` }} />
```

**Step 4: TypeScript check**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && git add components/app-sidebar.tsx && git commit -m "fix(sidebar): round battery and signal values to prevent decimal overflow display"
```

---

### Task 5: Fix TacticalHUD — always-dark video container

**Problem:** `tactical-hud.tsx` was changed from `bg-black` to `bg-background` in a previous cleanup. But this component IS a video feed panel — it must always be dark regardless of theme (black background is intentional for a camera feed, not a styling choice). In light mode `bg-background` is near-white, making the HUD look completely broken.

**Files:**
- Modify: `components/dashboard/tactical-hud.tsx`

**Step 1: Restore dark background on the outer HUD container**

Find (line 23):
```tsx
<div className="relative h-full w-full bg-background overflow-hidden rounded-xl border border-border/60 font-mono">
```
Change to:
```tsx
<div className="relative h-full w-full bg-zinc-950 overflow-hidden rounded-xl border border-border/40 font-mono">
```

Using `bg-zinc-950` (near-black) instead of `bg-black` gives a slight softness while remaining clearly dark in both themes.

**Step 2: TypeScript check**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && git add components/dashboard/tactical-hud.tsx && git commit -m "fix(hud): restore dark bg-zinc-950 on HUD container (video screen must always be dark)"
```

---

### Task 6: Final polish — control bar simplification + bottom bar height

**Problem:** The `ControlBar` has a pointless `grid-cols-12` outer div wrapping a single `col-span-12` child. Remove it. Also the bottom bar `h-32 md:h-28` is tall — tighten it.

**Files:**
- Modify: `components/dashboard/control-bar.tsx`
- Modify: `components/unified-dashboard.tsx`

**Step 1: Remove redundant grid wrapper in ControlBar**

In `control-bar.tsx`, find (line 46):
```tsx
<div className={`grid grid-cols-12 gap-3 h-full ${className ?? ""}`}>
  {/* Primary flight actions — 4 equal buttons */}
  <div className="col-span-12 grid grid-cols-2 grid-rows-2 md:grid-cols-4 md:grid-rows-1 gap-3 h-full">
```
Replace with (remove outer grid wrapper, keep inner):
```tsx
<div className={`grid grid-cols-2 grid-rows-2 md:grid-cols-4 md:grid-rows-1 gap-3 h-full ${className ?? ""}`}>
```
And remove the closing `</div>` that matched the now-removed outer `grid grid-cols-12` div.

**Step 2: Tighten bottom bar height in unified-dashboard.tsx**

Find:
```tsx
<div className="h-32 md:h-28 shrink-0 z-10">
```
Change to:
```tsx
<div className="h-24 md:h-20 shrink-0 z-10">
```

**Step 3: TypeScript check**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && git add components/dashboard/control-bar.tsx components/unified-dashboard.tsx && git commit -m "fix(dashboard): remove redundant grid wrapper in ControlBar, tighten bottom bar height"
```

---

### Final verification

Run dev server and check at 100% browser zoom:
```bash
cd "C:\Users\abdou\Desktop\Jawji\jawji-gcs\jawji-gcs" && npm run dev
```

Verify:
1. Left panel (SystemDiagnostics) has enough width — no text overflow, data readable
2. Center HUD shows proper drone silhouette placeholder when disconnected — not a blank black void
3. Wind vector arrow uses orange (primary) color, not emerald
4. Sidebar footer shows `29%` not `28.534092316666666%`
5. HUD container stays dark in both light and dark mode
6. Control bar buttons are compact and not excessively tall
