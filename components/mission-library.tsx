"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Copy,
  Play,
  Edit,
  MapPin,
  Clock,
  Calendar,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMissionStore } from "@/lib/mission-store"
import type { Mission as StoreMission } from "@/lib/mission-store"
import { useFirebaseAuth } from "@/lib/auth-service"
import { getUserProfile } from "@/lib/firestore-service"
import { toast } from "sonner"
import { z } from "zod"

type Mission = StoreMission

export function MissionLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")

  const { user } = useFirebaseAuth()
  const { missions, addMission, removeMission, importMissions, fetchMissions } = useMissionStore()

  useEffect(() => {
    async function load() {
      if (!user) return
      const p = await getUserProfile(user.uid)
      if (p?.orgId) fetchMissions(p.orgId)
    }
    load()
  }, [user, fetchMissions])

  const filteredMissions = missions.filter(
    (mission) =>
      mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const deleteMission = (id: string) => removeMission(id)

  const duplicateMission = (mission: Mission) => {
    addMission({
      name: `${mission.name} (Copy)`,
      description: mission.description,
      waypoints: mission.waypoints,
      distance: mission.distance,
      duration: mission.duration,
      status: "draft",
      droneId: mission.droneId,
      payload: mission.payload,
      altitude: mission.altitude,
      cruiseSpeed: mission.cruiseSpeed,
      geofence: mission.geofence,
      startTime: mission.startTime,
      riskAssessment: mission.riskAssessment,
      checklist: mission.checklist,
      waypointData: mission.waypointData,
    }, user)
    toast.success("Mission duplicated")
  }

  const loadExampleMission = () => {
    addMission({
      name: "Delivery with Kiosks",
      description: "Standard delivery route including 3 kiosk drops in Sector 4.",
      waypoints: 5,
      distance: 3.2,
      duration: 15,
      status: "ready",
      altitude: 60,
      cruiseSpeed: 10,
      checklist: ["Battery > 90%", "Payload Secured", "Clearance Received"],
      waypointData: [
        { id: "1", lat: 0, lng: 0, altitude: 60, action: "Takeoff" },
        { id: "2", lat: 0.001, lng: 0.001, altitude: 60, action: "Waypoint" },
        { id: "3", lat: 0.002, lng: 0.001, altitude: 40, action: "Kiosk Drop" },
        { id: "4", lat: 0.003, lng: 0.0, altitude: 60, action: "Waypoint" },
        { id: "5", lat: 0, lng: 0, altitude: 0, action: "Land" },
      ]
    }, user)
    toast.success("Example mission loaded")
  }

  const getStatusColor = (status: Mission["status"]) => {
    switch (status) {
      case "ready":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "draft":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  const WaypointSchema = z.object({
    id: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    altitude: z.number(),
    action: z.string(),
    speed: z.number().optional(),
  })

  const MissionSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string(),
    description: z.string().optional().default(""),
    waypoints: z.number().nonnegative().optional().default(0),
    distance: z.number().nonnegative().optional().default(0),
    duration: z.number().nonnegative().optional().default(0),
    createdAt: z.string().optional(),
    lastModified: z.string().optional(),
    status: z.enum(["draft", "ready", "completed"]).optional().default("draft"),
    droneId: z.any().optional(),
    payload: z.any().optional(),
    altitude: z.any().optional(),
    cruiseSpeed: z.any().optional(),
    geofence: z.any().optional(),
    startTime: z.any().optional(),
    riskAssessment: z.any().optional(),
    checklist: z.array(z.string()).optional().default([]),
    waypointData: z.array(WaypointSchema).optional(),
  })

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        const parsed = data.map((m) => MissionSchema.safeParse(m))
        const valids = parsed.filter((p) => p.success).map((p) => (p as any).data)
        const errors = parsed.length - valids.length
        if (valids.length > 0) {
          importMissions(
            valids.map((m: any) => ({
              id: String(m.id || Date.now() + Math.random()),
              name: m.name,
              description: m.description ?? "",
              waypoints: m.waypoints ?? 0,
              distance: m.distance ?? 0,
              duration: m.duration ?? 0,
              createdAt: m.createdAt || new Date().toISOString().split("T")[0],
              lastModified: m.lastModified || new Date().toISOString().split("T")[0],
              status: m.status ?? "draft",
              droneId: m.droneId,
              payload: m.payload,
              altitude: m.altitude,
              cruiseSpeed: m.cruiseSpeed,
              geofence: m.geofence,
              startTime: m.startTime,
              riskAssessment: m.riskAssessment,
              checklist: m.checklist ?? [],
              waypointData: Array.isArray(m.waypointData)
                ? m.waypointData.map((w: any, idx: number) => ({
                  ...w,
                  id: String(w.id ?? idx + 1),
                }))
                : undefined,
            }))
          )
        }
        if (errors > 0) toast.error(`${errors} mission(s) failed validation`)
        if (valids.length > 0) toast.success(`Imported ${valids.length} mission(s)`)
      } else if (data && typeof data === "object") {
        const parsed = MissionSchema.safeParse(data)
        if (!parsed.success) {
          toast.error("Mission failed validation")
        } else {
          const m = parsed.data
          addMission({
            name: m.name,
            description: m.description ?? "",
            waypoints: m.waypoints ?? 0,
            distance: m.distance ?? 0,
            duration: m.duration ?? 0,
            status: m.status ?? "draft",
            droneId: m.droneId,
            payload: m.payload,
            altitude: m.altitude,
            cruiseSpeed: m.cruiseSpeed,
            geofence: m.geofence,
            startTime: m.startTime,
            riskAssessment: m.riskAssessment,
            checklist: m.checklist ?? [],
            waypointData: Array.isArray(m.waypointData)
              ? m.waypointData.map((w: any, idx: number) => ({
                ...w,
                id: String(w.id ?? idx + 1),
              }))
              : undefined,
          }, user)
          toast.success("Imported mission")
        }
      }
    } catch {
      toast.error("Failed to import missions. Please check your file format.")
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const exportMission = (mission: Mission) => {
    const blob = new Blob([JSON.stringify(mission, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${mission.name.replace(/\s+/g, "_") || "mission"}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success("Mission exported")
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mission Library</h1>
          <p className="text-muted-foreground">Manage and organize your flight missions</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden md:flex items-center gap-1 mr-2">
            <Button size="sm" variant={viewMode === "cards" ? "default" : "outline"} className="h-8" onClick={() => setViewMode("cards")}>Cards</Button>
            <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} className="h-8" onClick={() => setViewMode("list")}>List</Button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button asChild>
            <Link href="/missions/planning">
              <Plus className="h-4 w-4 mr-2" />
              New Mission
            </Link>
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            All ({missions.length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Ready ({missions.filter((m) => m.status === "ready").length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Draft ({missions.filter((m) => m.status === "draft").length})
          </Badge>
        </div>
      </div>
      {viewMode === "list" ? (
        <div className="w-full">
          <div className="hidden md:grid grid-cols-12 px-3 py-4 text-base text-muted-foreground border-b border-border/50">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Waypoints</div>
            <div className="col-span-1">Dur</div>
            <div className="col-span-1">Dist</div>
            <div className="col-span-2">Modified</div>
          </div>
          <div className="divide-y divide-border/50">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="group grid grid-cols-12 items-center px-3 py-4 hover:bg-accent hover:text-foreground">
                <div className="col-span-12 md:col-span-4 min-w-0">
                  <div className="text-base font-medium truncate">{mission.name}</div>
                  <div className="text-sm text-muted-foreground group-hover:text-foreground truncate">{mission.description}</div>
                </div>
                <div className="col-span-6 md:col-span-2 mt-2 md:mt-0">
                  <Badge variant="outline" className={getStatusColor(mission.status)}>
                    {mission.status}
                  </Badge>
                </div>
                <div className="col-span-3 md:col-span-2 mt-2 md:mt-0 text-base text-muted-foreground group-hover:text-foreground">{mission.waypoints}</div>
                <div className="col-span-3 md:col-span-1 mt-2 md:mt-0 text-base text-muted-foreground group-hover:text-foreground">{mission.duration}m</div>
                <div className="col-span-3 md:col-span-1 mt-2 md:mt-0 text-base text-muted-foreground group-hover:text-foreground">{mission.distance}km</div>
                <div className="col-span-6 md:col-span-2 mt-2 md:mt-0 text-sm text-muted-foreground group-hover:text-foreground">{mission.lastModified}</div>
                <div className="col-span-6 md:col-span-12 md:justify-self-end mt-2 md:mt-0">
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="bg-transparent">
                      <Link href={`/missions/planning?missionId=${mission.id}`}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="bg-transparent">
                      <Link href={`/preflight?missionId=${mission.id}`}>
                        <Play className="h-3 w-3 mr-1" /> Pre-flight
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => duplicateMission(mission)}>
                          <Copy className="h-4 w-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportMission(mission)}>
                          <Download className="h-4 w-4 mr-2" /> Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMission(mission.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMissions.map((mission) => (
            <Card key={mission.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{mission.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{mission.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => duplicateMission(mission)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportMission(mission)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMission(mission.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge variant="outline" className={getStatusColor(mission.status)}>
                  {mission.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{mission.waypoints} waypoints</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{mission.duration} min</span>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Distance:</span>
                    <span className="text-foreground font-medium">{mission.distance} km</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">Modified {mission.lastModified}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">
                    <Play className="h-3 w-3 mr-1" />
                    Load
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/preflight?missionId=${mission.id}`}>
                      <Play className="h-3 w-3 mr-1" />
                      Pre-flight
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/missions/planning?missionId=${mission.id}`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredMissions.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">No missions found. Create a new one or load an example.</p>
          <Button variant="outline" onClick={loadExampleMission}>
            Load "Delivery with Kiosks" Example
          </Button>
        </div>
      )}
    </div>
  )
}
