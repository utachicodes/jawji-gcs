"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMissionStore } from "@/lib/mission-store"

interface Mission {
  id: string
  name: string
  description: string
  waypoints: number
  distance: number
  duration: number
  createdAt: string
  lastModified: string
  status: "draft" | "ready" | "completed"
}

export function MissionLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newMissionName, setNewMissionName] = useState("")
  const [newMissionDesc, setNewMissionDesc] = useState("")
  const missions = useMissionStore((s) => s.missions)
  const addMission = useMissionStore((s) => s.addMission)
  const removeMission = useMissionStore((s) => s.removeMission)

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
    })
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

  const canCreate = newMissionName.trim().length > 0 && newMissionDesc.trim().length > 0

  const createMission = () => {
    if (!canCreate) return
    addMission({
      name: newMissionName.trim(),
      description: newMissionDesc.trim(),
      waypoints: 0,
      distance: 0,
      duration: 0,
      status: "draft",
    })
    setNewMissionName("")
    setNewMissionDesc("")
    setCreateOpen(false)
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
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Mission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Mission</DialogTitle>
                <DialogDescription>Set up a new flight mission with custom parameters</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mission Name</Label>
                  <Input
                    placeholder="Enter mission name"
                    value={newMissionName}
                    onChange={(e) => setNewMissionName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter mission description"
                    value={newMissionDesc}
                    onChange={(e) => setNewMissionDesc(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={createMission} disabled={!canCreate}>Create Mission</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      {/* Mission Grid */}
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
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateMission(mission)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMissions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No missions found matching your search</p>
        </div>
      )}
    </div>
  )
}
