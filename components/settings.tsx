"use client"

import { useState } from "react"
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

export function Settings() {
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

  const handleAddDrone = () => {
    if (newDrone.name && newDrone.serialNumber) {
      addDrone({
        id: Date.now().toString(),
        name: newDrone.name,
        model: newDrone.model,
        serialNumber: newDrone.serialNumber,
        status: "offline",
        battery: 0,
        signal: 0,
        location: { lat: 0, lng: 0, alt: 0 },
      })
      setNewDrone({ name: "", model: "jawji-x1", serialNumber: "" })
      setIsAddingDrone(false)
    }
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
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fleet" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
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

        {/* Fleet Management tab for drone management */}
        <TabsContent value="fleet" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Drone Fleet</CardTitle>
                  <CardDescription>Manage your connected drones</CardDescription>
                </div>
                <Dialog open={isAddingDrone} onOpenChange={setIsAddingDrone}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Drone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Drone</DialogTitle>
                      <DialogDescription>Register a new drone to your fleet</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Drone Name</Label>
                        <Input
                          placeholder="e.g., Survey Drone 01"
                          value={newDrone.name}
                          onChange={(e) => setNewDrone({ ...newDrone, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                          value={newDrone.model}
                          onValueChange={(value) => setNewDrone({ ...newDrone, model: value })}
                        >
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
                      <div className="space-y-2">
                        <Label>Serial Number</Label>
                        <Input
                          placeholder="e.g., JX1-2024-001"
                          value={newDrone.serialNumber}
                          onChange={(e) => setNewDrone({ ...newDrone, serialNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingDrone(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddDrone}>Add Drone</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drones.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No drones registered yet</p>
                    <p className="text-sm">Click "Add Drone" to register your first drone</p>
                  </div>
                ) : (
                  drones.map((drone) => (
                    <Card key={drone.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{drone.name}</h3>
                            <Badge
                              variant={
                                drone.status === "active"
                                  ? "default"
                                  : drone.status === "idle"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {drone.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>Model:</span>
                              <span className="font-medium text-foreground">{drone.model.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>Serial:</span>
                              <span className="font-mono text-xs text-foreground">{drone.serialNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Battery className="h-3 w-3" />
                              <span>Battery:</span>
                              <span className="font-medium text-foreground">{drone.battery}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Signal className="h-3 w-3" />
                              <span>Signal:</span>
                              <span className="font-medium text-foreground">{drone.signal}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => removeDrone(drone.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
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
              <CardDescription>Configure camera and gimbal parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video Resolution</Label>
                  <Select defaultValue="1080p">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (1280x720)</SelectItem>
                      <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                      <SelectItem value="4k">4K (3840x2160)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frame Rate</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 fps</SelectItem>
                      <SelectItem value="30">30 fps</SelectItem>
                      <SelectItem value="60">60 fps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Photo Format</Label>
                  <Select defaultValue="jpg">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpg">JPEG</SelectItem>
                      <SelectItem value="raw">RAW</SelectItem>
                      <SelectItem value="both">JPEG + RAW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gimbal Mode</Label>
                  <Select defaultValue="follow">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow">Follow</SelectItem>
                      <SelectItem value="fpv">FPV</SelectItem>
                      <SelectItem value="lock">Lock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Ground control station settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Communication Protocol</Label>
                <Select defaultValue="mavlink">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mavlink">MAVLink</SelectItem>
                    <SelectItem value="custom">Custom Protocol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telemetry Rate (Hz)</Label>
                  <Input type="number" defaultValue="10" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Video Latency (ms)</Label>
                  <Input type="number" defaultValue="150" disabled />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Save Flight Logs</Label>
                  <p className="text-sm text-muted-foreground">Automatically save all flight data</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
