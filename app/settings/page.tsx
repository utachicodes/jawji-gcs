"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Settings, Globe, Radio, Bell, Database } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { AuthWrapper } from "@/components/auth-wrapper"

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <div className="w-full p-6 space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <Settings className="h-8 w-8 text-primary animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight">SYSTEM SETTINGS</h1>
              <p className="text-muted-foreground font-mono">Configure global application preferences</p>
            </div>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start h-12 bg-muted/50 p-1">
              <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">General</TabsTrigger>
              <TabsTrigger value="telemetry" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Telemetry</TabsTrigger>
              <TabsTrigger value="storage" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Storage</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Notifications</TabsTrigger>
            </TabsList>

            <section className="mt-8">
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Application Preferences</CardTitle>
                    <CardDescription>Regional and display settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Units</Label>
                        <p className="text-sm text-muted-foreground">Select unit system for telemetry (Metric vs Imperial)</p>
                      </div>
                      <div className="flex items-center bg-muted rounded-lg p-1">
                        <Button variant="ghost" size="sm" className="h-7 bg-background shadow-sm">Metric (m)</Button>
                        <Button variant="ghost" size="sm" className="h-7">Imperial (ft)</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">High Contrast Maps</Label>
                        <p className="text-sm text-muted-foreground">Increase map contrast for sunlight visibility</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Voice Announcements</Label>
                        <p className="text-sm text-muted-foreground">Enable text-to-speech for critical alerts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="telemetry">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-primary" /> Connection Settings</CardTitle>
                    <CardDescription>Configure telemetry stream endpoints</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>MAVLink Endpoints</Label>
                      <Input defaultValue="udp://127.0.0.1:14550" className="font-mono" />
                      <p className="text-xs text-muted-foreground">Primary UDP port for incoming telemetry</p>
                    </div>
                    <div className="space-y-2">
                      <Label>WebSocket Server</Label>
                      <Input defaultValue="ws://localhost:8080/telemetry" className="font-mono" />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Auto-Connect</Label>
                        <p className="text-sm text-muted-foreground">Attempt to connect on startup</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="storage">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Data Retention</CardTitle>
                    <CardDescription>Manage local logs and flight history</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Log Retention (Days)</Label>
                      <Input type="number" defaultValue="30" />
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 text-destructive">Danger Zone</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Clear all cached map tiles and local logs</span>
                        <Button variant="destructive" size="sm">Clear Cache</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Alert Configuration</CardTitle>
                    <CardDescription>Customize threshold for system alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-[1fr_80px] gap-4 items-center">
                        <Label>Low Battery Warning (%)</Label>
                        <Input type="number" defaultValue="20" />
                      </div>
                      <div className="grid grid-cols-[1fr_80px] gap-4 items-center">
                        <Label>Critical Battery (%)</Label>
                        <Input type="number" defaultValue="10" />
                      </div>
                      <div className="grid grid-cols-[1fr_80px] gap-4 items-center">
                        <Label>Max Altitude (m)</Label>
                        <Input type="number" defaultValue="120" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </section>
          </Tabs>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
