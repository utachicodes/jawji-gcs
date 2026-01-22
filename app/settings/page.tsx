"use client"

import { useState, useEffect } from "react"
import {
  User,
  Settings as SettingsIcon,
  Building2,
  ShieldAlert,
  Wifi,
  ChevronRight,
  LogOut,
  Save,
  Moon,
  Sun,
  LayoutDashboard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { useFirebaseAuth, logout } from '@/lib/auth-service'
import { getUserProfile, type UserProfile } from "@/lib/firestore-service"

const SETTINGS_TABS = [
  { id: 'general', label: 'General Preferences', icon: SettingsIcon },
  { id: 'account', label: 'Account Profile', icon: User },
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'network', label: 'Network & Telemetry', icon: Wifi },
  { id: 'advanced', label: 'Advanced', icon: ShieldAlert },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const { user } = useFirebaseAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile)
    }
  }, [user])

  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full flex flex-col lg:flex-row gap-6 p-6 lg:p-8 overflow-hidden">

          {/* SIDEBAR NAVIGATION */}
          <div className="lg:w-64 flex-shrink-0 flex flex-col gap-6 h-full">
            <div className="px-2">
              <h1 className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
                <SettingsIcon className="h-6 w-6 text-primary" /> SETTINGS
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                System Configuration v2.4.0
              </p>
            </div>

            <Card className="flex-1 bg-card/60 backdrop-blur border-primary/10 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {SETTINGS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                                    w-full flex items-center justify-between p-3 rounded-md text-sm transition-all text-left font-mono
                                    ${activeTab === tab.id
                          ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                        }
                                `}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </div>
                      {activeTab === tab.id && <ChevronRight className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-white/5">
                <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 font-mono" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </Card>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 h-full min-w-0 flex flex-col">
            <Card className="flex-1 bg-card/40 backdrop-blur border-none shadow-none flex flex-col overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-1">
                  {activeTab === 'general' && (
                    <div className="space-y-6 max-w-2xl">
                      <div>
                        <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
                          <SettingsIcon className="h-5 w-5 text-primary" /> General Preferences
                        </h2>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                            <div className="space-y-0.5">
                              <Label className="text-base">Dark Mode</Label>
                              <p className="text-xs text-muted-foreground">Force high-contrast dark theme for cockpit visibility.</p>
                            </div>
                            <Switch checked={true} disabled />
                          </div>

                          <div className="grid gap-2">
                            <Label>Measurement Units</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" className="justify-start font-mono border-primary/50 text-primary bg-primary/10">
                                Metric (m, km/h)
                              </Button>
                              <Button variant="outline" className="justify-start font-mono text-muted-foreground">
                                Imperial (ft, mph)
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-2 pt-4">
                            <Label>Dashboard Layout</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border rounded-lg p-2 cursor-pointer hover:border-primary/50 transition-colors bg-primary/5 border-primary">
                                <div className="aspect-video bg-background/50 rounded mb-2 border border-dashed flex items-center justify-center">
                                  <LayoutDashboard className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-xs font-mono font-bold text-center">Split View</div>
                              </div>
                              <div className="border rounded-lg p-2 cursor-pointer hover:border-primary/50 transition-colors opacity-50">
                                <div className="aspect-video bg-background/50 rounded mb-2 border border-dashed flex items-center justify-center">
                                  <div className="h-4 w-4 border border-current rounded-sm" />
                                </div>
                                <div className="text-xs font-mono font-bold text-center">Classic</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'account' && (
                    <div className="space-y-6 max-w-2xl">
                      <div>
                        <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" /> User Profile
                        </h2>
                        <Card className="bg-card/50">
                          <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                                <span className="text-2xl font-bold font-mono text-primary">
                                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-lg">{user?.displayName || "Pilot"}</div>
                                <div className="text-sm text-muted-foreground font-mono">{user?.email}</div>
                                <Badge variant="secondary" className="mt-1">Level 1 Operator</Badge>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="display-name">Display Name</Label>
                              <Input id="display-name" defaultValue={user?.displayName || ''} />
                            </div>
                            <Button className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4" /> Save Profile</Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeTab === 'org' && (
                    <div className="space-y-6 max-w-2xl">
                      <div>
                        <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" /> Organization
                        </h2>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Current Workspace</CardTitle>
                            <CardDescription>Collaborate with your drone fleet team</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded-lg border border-white/5">
                              <Label className="text-xs text-muted-foreground uppercase">Organization ID</Label>
                              <div className="font-mono text-lg font-bold tracking-wider mt-1 flex items-center gap-2">
                                {profile?.orgId || "NO-ORG-ASSIGNED"}
                                {profile?.orgId && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">ACTIVE</Badge>}
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label>Organization Name</Label>
                              <div className="flex gap-2">
                                <Input defaultValue={profile?.orgId ? "Orbit Corp" : "My Organization"} />
                                <Button variant="outline"><Save className="h-4 w-4" /></Button>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label>Invite Member</Label>
                              <div className="flex gap-2">
                                <Input placeholder="pilot@example.com" className="font-mono text-sm" />
                                <Button>Invite</Button>
                              </div>
                              <p className="text-xs text-muted-foreground">Admins only. New members will join as viewers.</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeTab === 'advanced' && (
                    <div className="space-y-6 max-w-2xl">
                      <div>
                        <h2 className="text-xl font-bold font-mono text-red-500 flex items-center gap-2">
                          <ShieldAlert className="h-5 w-5" /> Danger Zone
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                          Advanced actions that can affect system stability. These actions are irreversible.
                        </p>

                        <div className="space-y-4">
                          <Card className="border-red-900/20 bg-red-950/10">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-red-400 font-bold">Clear Local Cache</Label>
                                <p className="text-xs text-muted-foreground">Remove all locally stored mission plans and logs.</p>
                              </div>
                              <Button variant="destructive" size="sm">Clear Data</Button>
                            </CardContent>
                          </Card>

                          <Card className="border-red-900/20 bg-red-950/10">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-red-400 font-bold">Factory Reset GCS</Label>
                                <p className="text-xs text-muted-foreground">Reset all settings to default values.</p>
                              </div>
                              <Button variant="destructive" size="sm">Reset All</Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'network' && (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground h-[400px]">
                      <Wifi className="h-16 w-16 opacity-20 mb-4 animate-pulse" />
                      <h3 className="text-lg font-medium font-mono">NETWORK DIAGNOSTICS</h3>
                      <p className="max-w-xs mx-auto mt-2">Telemetry bridge is currently operating in low-latency mode. Advanced network settings are locked by administrator.</p>
                    </div>
                  )}

                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
