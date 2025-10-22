export type Telemetry = {
  altitude: number
  speed: number
  heading: number
  battery: number
  signal: number
  temperature: number
  pitch: number
  roll: number
  yaw: number
  latitude: number
  longitude: number
  flightTime: number
  flightMode: string
}

export type TelemetryListener = (t: Telemetry) => void

class TelemetryBus {
  private listeners: Set<TelemetryListener> = new Set()
  private timer: any = null
  private t: Telemetry

  constructor(initial?: Partial<Telemetry>) {
    this.t = {
      altitude: 45.2,
      speed: 5.8,
      heading: 127,
      battery: 87,
      signal: 92,
      temperature: 24,
      pitch: 2.3,
      roll: -1.2,
      yaw: 127,
      latitude: 37.7749,
      longitude: -122.4194,
      flightTime: 0,
      flightMode: "AUTO",
      ...initial,
    }
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.t = {
        ...this.t,
        altitude: Math.max(0, this.t.altitude + (Math.random() - 0.5) * 2),
        speed: Math.max(0, this.t.speed + (Math.random() - 0.5) * 0.5),
        heading: (this.t.heading + (Math.random() - 0.5) * 5 + 360) % 360,
        pitch: Math.max(-15, Math.min(15, this.t.pitch + (Math.random() - 0.5) * 0.5)),
        roll: Math.max(-15, Math.min(15, this.t.roll + (Math.random() - 0.5) * 0.5)),
        latitude: this.t.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: this.t.longitude + (Math.random() - 0.5) * 0.0001,
        flightTime: this.t.flightTime + 1,
        battery: Math.max(0, this.t.battery - Math.random() * 0.02),
        signal: Math.max(0, Math.min(100, this.t.signal + (Math.random() - 0.5) * 0.2)),
      }
      this.emit()
    }, 1000)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  subscribe(listener: TelemetryListener) {
    this.listeners.add(listener)
    listener(this.t)
    if (!this.timer) this.start()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.stop()
    }
  }

  private emit() {
    for (const l of this.listeners) l(this.t)
  }
}

export function createMockTelemetry(initial?: Partial<Telemetry>) {
  return new TelemetryBus(initial)
}
