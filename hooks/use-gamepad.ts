"use client"

import { useEffect, useRef, useState } from "react"

export type GamepadState = {
  left: { x: number; y: number }
  right: { x: number; y: number }
  connected: boolean
}

export function useGamepad(enabled: boolean) {
  const [state, setState] = useState<GamepadState>({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 }, connected: false })
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (raf.current) cancelAnimationFrame(raf.current)
      setState((s) => ({ ...s, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }))
      return
    }

    const onConnect = () => setState((s) => ({ ...s, connected: true }))
    const onDisconnect = () => setState((s) => ({ ...s, connected: false }))

    window.addEventListener("gamepadconnected", onConnect)
    window.addEventListener("gamepaddisconnected", onDisconnect)

    const loop = () => {
      const pads = navigator.getGamepads?.()
      const gp = pads && pads[0]
      if (gp) {
        const ax = gp.axes || []
        const left = { x: ax[0] ?? 0, y: ax[1] ?? 0 }
        const right = { x: ax[2] ?? 0, y: ax[3] ?? 0 }
        setState({ left, right, connected: true })
      }
      raf.current = requestAnimationFrame(loop)
    }

    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      window.removeEventListener("gamepadconnected", onConnect)
      window.removeEventListener("gamepaddisconnected", onDisconnect)
    }
  }, [enabled])

  return state
}
