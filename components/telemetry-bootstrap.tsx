"use client"

import { useEffect } from "react"
import { startTelemetrySimulator } from "@/lib/telemetry-simulator"

export function TelemetryBootstrap() {
  useEffect(() => {
    const stop = startTelemetrySimulator()
    return () => stop?.()
  }, [])
  return null
}
