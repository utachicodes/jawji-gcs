/**
 * Browser-side MAVLink WebSocket client.
 * Singleton — import `mavlinkClient` directly.
 */

export const MAVLINK_WS_URL =
  process.env.NEXT_PUBLIC_MAVLINK_WS_URL ?? "ws://localhost:8765"

export interface BridgeMessage {
  type: string
  [k: string]: unknown
}

type Listener = (msg: BridgeMessage) => void

class MavlinkBridgeClient {
  private ws: WebSocket | null = null
  private url: string = MAVLINK_WS_URL
  private reconnectDelay: number = 2000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<Listener> = new Set()
  private sendQueue: string[] = []
  private _connected = false

  connect(url: string = MAVLINK_WS_URL): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    this.url = url
    this._open()
  }

  private _open(): void {
    try {
      const ws = new WebSocket(this.url)
      this.ws = ws

      ws.onopen = () => {
        this._connected = true
        this.reconnectDelay = 2000
        // Flush queued messages
        while (this.sendQueue.length) {
          ws.send(this.sendQueue.shift()!)
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg: BridgeMessage = JSON.parse(event.data as string)
          this.listeners.forEach((fn) => fn(msg))
        } catch {
          // ignore malformed
        }
      }

      ws.onclose = () => {
        this._connected = false
        this.ws = null
        this._scheduleReconnect()
      }

      ws.onerror = () => {
        // onclose fires right after; let it handle reconnect
      }
    } catch {
      this._scheduleReconnect()
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this._open()
    }, this.reconnectDelay)
    // Exponential back-off: cap at 30 s
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000)
  }

  get connected(): boolean {
    return this._connected
  }

  send(msg: object): void {
    const data = JSON.stringify(msg)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      this.sendQueue.push(data)
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  // ── Command helpers ─────────────────────────────────────────────────────────

  sendCommand(type: string, params: object = {}): void {
    this.send({ type, ...params })
  }

  sendRC(channels: number[]): void {
    this.send({ type: "RC_OVERRIDE", channels })
  }
}

export const mavlinkClient = new MavlinkBridgeClient()
