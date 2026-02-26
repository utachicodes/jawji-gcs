"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { mavlinkClient, MAVLINK_WS_URL, type BridgeMessage } from "@/lib/mavlink-ws-client"
import { useDroneStore } from "@/lib/drone-store"

const RC_HZ = 20  // RC override frequency cap

/**
 * Channel mapping (Mode 2 — standard ArduPilot):
 *   Ch1 = Roll       (1000–2000 µs, center 1500)
 *   Ch2 = Pitch      (1000–2000 µs, center 1500, forward = lower value)
 *   Ch3 = Throttle   (1000 = min, 2000 = max)
 *   Ch4 = Yaw        (1000–2000 µs, center 1500)
 *
 * Joystick → channel: Math.round(1500 + value * 500) clamped to [1000, 2000]
 */
function joystickToChannel(value: number): number {
  return Math.max(1000, Math.min(2000, Math.round(1500 + value * 500)))
}

export function useMavlink() {
  const updateDrone = useDroneStore((s) => s.updateDrone)
  const selectedDroneId = useDroneStore((s) => s.selectedDrone)
  const drones = useDroneStore((s) => s.drones)

  const [connected, setConnected] = useState(false)
  const [armed, setArmed] = useState(false)
  const [mode, setMode] = useState("UNKNOWN")
  const [sysid, setSysid] = useState<number | null>(null)

  const lastRcSend = useRef(0)

  // Connect on mount (singleton — safe to call multiple times)
  useEffect(() => {
    mavlinkClient.connect(MAVLINK_WS_URL)

    const unsub = mavlinkClient.subscribe((msg: BridgeMessage) => {
      const droneId = selectedDroneId ?? drones[0]?.id

      switch (msg.type) {
        case "connected":
          setConnected(true)
          setSysid(msg.sysid as number)
          break

        case "disconnected":
          setConnected(false)
          setSysid(null)
          break

        case "heartbeat":
          setArmed(msg.armed as boolean)
          setMode(msg.mode as string)
          break

        case "telemetry": {
          const d = msg.data as Record<string, unknown>
          if (!droneId) break
          updateDrone(droneId, {
            battery:      d.battery as number,
            speed:        d.speed as number,
            mode:         d.mode as string,
            gpsSatellites: d.gpsSatellites as number,
            location: {
              lat:      d.lat as number,
              lng:      d.lng as number,
              altitude: d.altitude as number,
            },
          })
          break
        }

        default:
          break
      }
    })

    return unsub
  }, [selectedDroneId, drones, updateDrone])

  // ── Commands ────────────────────────────────────────────────────────────────

  const arm = useCallback(() => {
    mavlinkClient.sendCommand("ARM", { arm: true })
  }, [])

  const disarm = useCallback(() => {
    mavlinkClient.sendCommand("ARM", { arm: false })
  }, [])

  const takeoff = useCallback((altitude: number = 10) => {
    mavlinkClient.sendCommand("TAKEOFF", { altitude })
  }, [])

  const land = useCallback(() => {
    mavlinkClient.sendCommand("LAND")
  }, [])

  const rtl = useCallback(() => {
    mavlinkClient.sendCommand("RTL")
  }, [])

  const setFlightMode = useCallback((flightMode: string) => {
    mavlinkClient.sendCommand("SET_MODE", { mode: flightMode })
  }, [])

  /**
   * Send RC override.
   * throttle: -1..1 (y-axis of left joystick, up = positive)
   * yaw:      -1..1 (x-axis of left joystick)
   * pitch:    -1..1 (y-axis of right joystick, up = positive → nose down in Mode 2)
   * roll:     -1..1 (x-axis of right joystick)
   */
  const sendRC = useCallback(
    (throttle: number, yaw: number, pitch: number, roll: number) => {
      const now = Date.now()
      if (now - lastRcSend.current < 1000 / RC_HZ) return
      lastRcSend.current = now

      // Ch3 throttle: center 0 → 1500; full up → 2000; full down → 1000
      const ch3 = joystickToChannel(throttle)
      // Ch2 pitch: forward (positive y) → lower value (nose down)
      const ch2 = joystickToChannel(-pitch)
      const ch1 = joystickToChannel(roll)
      const ch4 = joystickToChannel(yaw)

      mavlinkClient.sendRC([ch1, ch2, ch3, ch4, 0, 0, 0, 0])
    },
    []
  )

  return {
    connected,
    armed,
    mode,
    sysid,
    arm,
    disarm,
    takeoff,
    land,
    rtl,
    setMode: setFlightMode,
    sendRC,
  }
}
