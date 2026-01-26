"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Shield, Smartphone, Bell, Eye, Lock } from "lucide-react"

import { AppLayout } from "@/components/app-layout"

export default function ProfilePage() {
    return (
        <AppLayout>
            <div className="w-full p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-mono tracking-tight">OPERATOR PROFILE</h1>
                        <p className="text-muted-foreground font-mono">Manage your identity and access credentials</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-mono text-lg flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> PERSONAL INFORMATION
                            </CardTitle>
                            <CardDescription>Update your personal details and contact info</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullname">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="fullname" defaultValue="John Operator" className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" defaultValue="operator@jawji.com" className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="role" defaultValue="Chief Pilot" className="pl-9" disabled />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="phone" defaultValue="+1 (555) 000-0000" className="pl-9" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button>Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-mono text-lg flex items-center gap-2">
                                <Lock className="h-4 w-4 text-primary" /> SECURITY
                            </CardTitle>
                            <CardDescription>Manage your password and authentication sessions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input type="password" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input type="password" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button variant="outline">Update Password</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
