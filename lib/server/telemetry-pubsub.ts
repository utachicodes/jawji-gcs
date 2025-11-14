type Listener = (data: unknown) => void

const listeners: Set<Listener> = new Set()

export function publishTelemetry(data: unknown) {
  for (const l of listeners) {
    try {
      l(data)
    } catch {
      // ignore listener errors
    }
  }
}

export function subscribeTelemetry(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}


