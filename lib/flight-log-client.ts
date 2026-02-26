/**
 * Flight log types and browser API client.
 */

export interface FlightLogSummary {
  maxAltitude:   number
  maxSpeed:      number
  totalDistance: number
  duration:      number   // seconds
  minBattery:    number
}

export interface FlightLog {
  id:        string
  droneId:   string
  missionId?: string
  startTime: string       // ISO 8601
  endTime?:  string
  status:    "recording" | "completed"
  summary:   FlightLogSummary
}

export interface FlightLogEntry {
  ts:       number   // Unix ms
  lat:      number
  lng:      number
  altitude: number
  speed:    number
  battery:  number
  heading:  number
  mode:     string
}

// ── API client helpers ────────────────────────────────────────────────────────

export async function createFlightLog(
  payload: Pick<FlightLog, "droneId" | "missionId">
): Promise<FlightLog> {
  const res = await fetch("/api/flight-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`createFlightLog: ${res.status}`)
  return res.json()
}

export async function listFlightLogs(): Promise<FlightLog[]> {
  const res = await fetch("/api/flight-logs")
  if (!res.ok) throw new Error(`listFlightLogs: ${res.status}`)
  return res.json()
}

export async function getFlightLog(id: string): Promise<FlightLog & { entries: FlightLogEntry[] }> {
  const res = await fetch(`/api/flight-logs/${id}`)
  if (!res.ok) throw new Error(`getFlightLog: ${res.status}`)
  return res.json()
}

export async function deleteFlightLog(id: string): Promise<void> {
  const res = await fetch(`/api/flight-logs/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`deleteFlightLog: ${res.status}`)
}

export async function appendFlightLogEntries(
  id: string,
  entries: FlightLogEntry[]
): Promise<void> {
  const res = await fetch(`/api/flight-logs/${id}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries),
  })
  if (!res.ok) throw new Error(`appendFlightLogEntries: ${res.status}`)
}
