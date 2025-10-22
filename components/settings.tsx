"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Save, RefreshCw, Download, Upload, Plus, Trash2, Edit, Battery, Signal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useDroneStore } from "@/lib/drone-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Settings() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = (searchParams.get("tab") || "fleet").toLowerCase()
  const [tab, setTab] = useState<string>(initialTab)
  useEffect(() => {
    const next = (searchParams.get("tab") || "fleet").toLowerCase()
    if (next !== tab) setTab(next)
  }, [searchParams])
  const onTabChange = (next: string) => {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", next)
    router.replace(url.pathname + "?" + url.searchParams.toString())
  }
  const [hasChanges, setHasChanges] = useState(false)
  const { drones, addDrone, removeDrone, updateDrone } = useDroneStore()
  const [isAddingDrone, setIsAddingDrone] = useState(false)
  const [newDrone, setNewDrone] = useState({
    name: "",
    model: "jawji-x1",
    serialNumber: "",
  })
  const [profile, setProfile] = useState({
    name: "John Operator",
    email: "operator@jawji.com",
    role: "Senior Pilot",
    callSign: "ALPHA-1",
    certifications: "Part 107, Advanced Operations",
  })

  const [preferences, setPreferences] = useState({
    units: "metric",
    mapProvider: "osm",
    telemetryRate: "10",
    videoQuality: "high",
    notifications: true,
    soundAlerts: true,
    autoSave: true,
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const defaultProfile = { name: "John Operator", email: "operator@jawji.com", role: "Senior Pilot", callSign: "ALPHA-1", certifications: "Part 107, Advanced Operations" }
  const defaultPreferences = { units: "metric", mapProvider: "osm", telemetryRate: "10", videoQuality: "high", notifications: true, soundAlerts: true, autoSave: true }

  useEffect(() => {
    try {
      const p = localStorage.getItem("jawji_profile")
      const pref = localStorage.getItem("jawji_preferences")
      if (p) setProfile(JSON.parse(p))
      if (pref) setPreferences(JSON.parse(pref))
      setHasChanges(false)
    } catch {}
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem("jawji_profile", JSON.stringify(profile))
      localStorage.setItem("jawji_preferences", JSON.stringify(preferences))
      setHasChanges(false)
    } catch {}
  }

  const handleReset = () => {
    setProfile(defaultProfile)
    setPreferences(defaultPreferences)
    setHasChanges(true)
  }

  const handleExport = () => {
    const data = { profile, preferences }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "jawji-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.profile) setProfile(data.profile)
      if (data.preferences) setPreferences(data.preferences)
      setHasChanges(true)
    } catch {}
  }

  const handleAddDrone = () => {
    const valid = newDrone.name.trim().length > 0 && newDrone.model.trim().length > 0
    if (!valid) return
    addDrone({
      name: newDrone.name.trim(),
      model: newDrone.model.trim(),
      status: "offline",
      mode: "Standby",
      battery: 0,
      signal: 0,
      location: { lat: 0, lng: 0, altitude: 0 },
    })
    setNewDrone({ name: "", model: "jawji-x1", serialNumber: "" })
    setIsAddingDrone(false)
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your drone and ground control station</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && handleImport(e.target.files[0])} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="drone">Drone</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Operator Profile</CardTitle>
              <CardDescription>Manage your operator information and credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => {
                      setProfile({ ...profile, name: e.target.value })
                      setHasChanges(true)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Call Sign</Label>
                  <Input
                    value={profile.callSign}
                    onChange={(e) => {
                      setProfile({ ...profile, callSign: e.target.value })
                      setHasChanges(true)
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => {
                    setProfile({ ...profile, email: e.target.value })
                    setHasChanges(true)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={profile.role}
                  onValueChange={(value) => {
                    setProfile({ ...profile, role: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Senior Pilot">Senior Pilot</SelectItem>
                    <SelectItem value="Pilot">Pilot</SelectItem>
                    <SelectItem value="Observer">Observer</SelectItem>
                    <SelectItem value="Technician">Technician</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Certifications</Label>
                <Input
                  value={profile.certifications}
                  onChange={(e) => {
                    setProfile({ ...profile, certifications: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="e.g., Part 107, Advanced Operations"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Change Password</Label>
                <Input type="password" placeholder="Current password" />
                <Input type="password" placeholder="New password" />
                <Input type="password" placeholder="Confirm new password" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize your ground control station interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Unit System</Label>
                <Select
                  value={preferences.units}
                  onValueChange={(value) => {
                    setPreferences({ ...preferences, units: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (m, km, m/s)</SelectItem>
                    <SelectItem value="imperial">Imperial (ft, mi, mph)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Map Provider</Label>
                <Select
                  value={preferences.mapProvider}
                  onValueChange={(value) => {
                    setPreferences({ ...preferences, mapProvider: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="osm">OpenStreetMap</SelectItem>
                    <SelectItem value="satellite">Satellite Imagery</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telemetry Update Rate</Label>
                <Select
                  value={preferences.telemetryRate}
                  onValueChange={(value) => {
                    setPreferences({ ...preferences, telemetryRate: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Hz (Low)</SelectItem>
                    <SelectItem value="10">10 Hz (Normal)</SelectItem>
                    <SelectItem value="20">20 Hz (High)</SelectItem>
                    <SelectItem value="30">30 Hz (Maximum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Video Quality</Label>
                <Select
                  value={preferences.videoQuality}
                  onValueChange={(value) => {
                    setPreferences({ ...preferences, videoQuality: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Save Bandwidth)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="ultra">Ultra (Max Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications & Alerts</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show system notifications</p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => {
                    setPreferences({ ...preferences, notifications: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">Play audio alerts for warnings</p>
                </div>
                <Switch
                  checked={preferences.soundAlerts}
                  onCheckedChange={(checked) => {
                    setPreferences({ ...preferences, soundAlerts: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Save Settings</Label>
                  <p className="text-sm text-muted-foreground">Automatically save configuration changes</p>
                </div>
                <Switch
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => {
                    setPreferences({ ...preferences, autoSave: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        

        <TabsContent value="drone" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Drone Configuration</CardTitle>
              <CardDescription>Basic drone parameters and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Drone ID</Label>
                  <Input defaultValue="JAWJI-001" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Drone Model</Label>
                  <Select defaultValue="jawji-x1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jawji-x1">JAWJI X1</SelectItem>
                      <SelectItem value="jawji-x2">JAWJI X2 Pro</SelectItem>
                      <SelectItem value="jawji-x3">JAWJI X3 Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Flight Speed (m/s)</Label>
                  <Input type="number" defaultValue="15" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Altitude (m)</Label>
                  <Input type="number" defaultValue="120" onChange={() => setHasChanges(true)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Battery Capacity (mAh)</Label>
                  <Input type="number" defaultValue="5000" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Low Battery Warning (%)</Label>
                  <Input type="number" defaultValue="20" onChange={() => setHasChanges(true)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety Settings</CardTitle>
              <CardDescription>Configure safety and failsafe parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Return to Home on Signal Loss</Label>
                  <p className="text-sm text-muted-foreground">Automatically return when connection is lost</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Land on Low Battery</Label>
                  <p className="text-sm text-muted-foreground">Land automatically when battery is critically low</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Obstacle Avoidance</Label>
                  <p className="text-sm text-muted-foreground">Enable automatic obstacle detection and avoidance</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Return Home Altitude (m)</Label>
                <Input type="number" defaultValue="50" onChange={() => setHasChanges(true)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation System</CardTitle>
              <CardDescription>Configure GPS-denied navigation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Navigation Mode</Label>
                <Select defaultValue="visual-slam">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual-slam">Visual SLAM</SelectItem>
                    <SelectItem value="lidar">LiDAR SLAM</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Visual + LiDAR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI-Assisted Path Planning</Label>
                  <p className="text-sm text-muted-foreground">Use AI for intelligent route optimization</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Mapping</Label>
                  <p className="text-sm text-muted-foreground">Generate 3D maps during flight</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position Update Rate (Hz)</Label>
                  <Input type="number" defaultValue="30" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Map Resolution (cm)</Label>
                  <Input type="number" defaultValue="5" onChange={() => setHasChanges(true)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="camera" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Camera Settings</CardTitle>
              <CardDescription>Configure video input and stream quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Video Source</Label>
                <Select defaultValue="primary">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Camera</SelectItem>
                    <SelectItem value="secondary">Secondary Camera</SelectItem>
                    <SelectItem value="simulated">Simulated Feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select defaultValue="1080p">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">1280x720</SelectItem>
                      <SelectItem value="1080p">1920x1080</SelectItem>
                      <SelectItem value="4k">3840x2160</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Framerate (FPS)</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bitrate (kbps)</Label>
                  <Input type="number" defaultValue="4000" onChange={() => setHasChanges(true)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stabilization</Label>
                    <p className="text-sm text-muted-foreground">Enable digital video stabilization</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>General application and data controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save configuration changes</p>
                </div>
                <Switch
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => {
                    setPreferences({ ...preferences, autoSave: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Import Config
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" /> Export Config
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
