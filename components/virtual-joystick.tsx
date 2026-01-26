"use client"

import { useEffect, useRef, useState } from "react"

interface JoystickProps {
  onMove?: (x: number, y: number) => void
}

// <CHANGE> Removed label prop and made component simpler
export function VirtualJoystick({ onMove }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

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
      onMove?.(x / maxDistance, y / maxDistance)
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
      setPosition({ x: 0, y: 0 })
      onMove?.(0, 0)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchend", handleEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, onMove])

  return (
    <div
      ref={containerRef}
      className="relative w-40 h-40 rounded-full bg-white border-2 border-border cursor-pointer touch-none"
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted/50 to-muted" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-border rounded-full" />
      <div
        className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-zinc-800 dark:bg-zinc-100 shadow-lg transition-transform flex items-center justify-center after:content-[''] after:w-3 after:h-3 after:rounded-full after:bg-zinc-600/50 dark:after:bg-zinc-300/50"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      />
    </div>
  )
}
