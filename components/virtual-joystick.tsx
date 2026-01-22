"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface JoystickProps {
  onMove?: (x: number, y: number) => void
  size?: number
}

// <CHANGE> Added size prop support
export function VirtualJoystick({ onMove, size = 160 }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const handleEnd = () => {
    setIsDragging(false)
    setPosition({ x: 0, y: 0 })
    onMove?.(0, 0)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    handlePointerMove(e)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging && e.type !== 'pointerdown') return
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // ClientX/Y relative to the container center
    let x = e.clientX - rect.left - centerX
    let y = e.clientY - rect.top - centerY

    const distance = Math.sqrt(x * x + y * y)
    const maxDistance = centerX - 20

    // Clamp the dot within the circle
    if (distance > maxDistance) {
      const angle = Math.atan2(y, x)
      x = Math.cos(angle) * maxDistance
      y = Math.sin(angle) * maxDistance
    }

    setPosition({ x, y })
    // Normalize output -1 to 1
    onMove?.(x / maxDistance, y / maxDistance)
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-full bg-muted border-2 border-border cursor-pointer touch-none select-none"
      style={{ width: size, height: size }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onPointerLeave={handleEnd}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted/50 to-muted pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-border rounded-full pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 rounded-full bg-primary shadow-lg transition-transform pointer-events-none"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      />
    </div>
  )
}
