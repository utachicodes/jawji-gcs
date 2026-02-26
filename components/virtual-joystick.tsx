"use client"

import { useEffect, useRef, useState } from "react"

interface JoystickProps {
  onMove?: (x: number, y: number) => void
  label?: string
  size?: "sm" | "md" | "lg"
  expo?: number // 0-1, expo curve strength
}

function applyExpo(value: number, expo: number): number {
  // expo curve: output = value * (1 - expo) + value^3 * expo
  return value * (1 - expo) + Math.pow(value, 3) * expo
}

const SIZE_MAP = { sm: 120, md: 160, lg: 180 }
const DEADZONE = 0.15 // 15% deadzone

export function VirtualJoystick({ onMove, label, size = "md", expo = 0.3 }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const px = SIZE_MAP[size]

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!containerRef.current || !isDragging) return

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      let x = clientX - rect.left - centerX
      let y = clientY - rect.top - centerY

      const distance = Math.sqrt(x * x + y * y)
      const maxDistance = centerX - 20

      if (distance > maxDistance) {
        const angle = Math.atan2(y, x)
        x = Math.cos(angle) * maxDistance
        y = Math.sin(angle) * maxDistance
      }

      setPosition({ x, y })

      // Normalize to -1..1
      let nx = x / maxDistance
      let ny = y / maxDistance

      // Apply deadzone
      const nd = Math.sqrt(nx * nx + ny * ny)
      if (nd < DEADZONE) {
        nx = 0
        ny = 0
      } else {
        const scale = (nd - DEADZONE) / (1 - DEADZONE)
        nx = (nx / nd) * scale
        ny = (ny / nd) * scale
      }

      // Apply expo curve
      const sign_x = Math.sign(nx)
      const sign_y = Math.sign(ny)
      nx = sign_x * applyExpo(Math.abs(nx), expo)
      ny = sign_y * applyExpo(Math.abs(ny), expo)

      onMove?.(nx, ny)

      // Haptic feedback hint
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(1)
      }
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    const handleEnd = () => {
      setIsDragging(false)
      setPosition({ x: 0, y: 0 })
      onMove?.(0, 0)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("touchmove", handleTouchMove, { passive: true })
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchend", handleEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, onMove, expo])

  const deadzoneRadius = (px / 2 - 20) * DEADZONE

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-xs text-muted-foreground font-medium tracking-wide">{label}</span>}
      <div
        ref={containerRef}
        className="relative rounded-full cursor-pointer touch-none select-none"
        style={{ width: px, height: px }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Base gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-inner" />
        {/* Grid lines */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-400" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-400" />
        </div>
        {/* Deadzone ring */}
        <div
          className="absolute rounded-full border border-dashed border-zinc-600 opacity-40 pointer-events-none"
          style={{
            width: deadzoneRadius * 2,
            height: deadzoneRadius * 2,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-500" />
        {/* Knob */}
        <div
          className="absolute w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
            background: isDragging
              ? "radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.6))"
              : "radial-gradient(circle at 35% 35%, #e4e4e7, #71717a)",
            boxShadow: isDragging
              ? "0 0 12px hsl(var(--primary) / 0.5), 0 2px 8px rgba(0,0,0,0.5)"
              : "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          <div className="w-3 h-3 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  )
}
