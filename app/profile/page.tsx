"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Building2, Lock, Shield, CheckCircle2, Plus, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { useFirebaseAuth } from "@/lib/auth-service"
import {
    createOrganization,
    getOrganization,
    getUserProfile,
    addMemberToOrganization,
    Organization,
    UserProfile
} from "@/lib/firestore-service"

export default function ProfilePage() {
    // Auth State
    const { user: authUser, loading: authLoading } = useFirebaseAuth()

    // Data State
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [org, setOrg] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)

    // Form States
    const [orgName, setOrgName] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")
    const [isCreatingOrg, setIsCreatingOrg] = useState(false)
    const [isInviting, setIsInviting] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            if (!authUser) return

            try {
                // 1. Get User Profile (or use auth defaults)
                let userProfile = await getUserProfile(authUser.uid)

                if (!userProfile) {
                    // Implicitly create profile if missing (first load)
                    userProfile = {
                        uid: authUser.uid,
                        email: authUser.email!,
                        displayName: authUser.displayName || "Pilot",
                        photoURL: authUser.photoURL || undefined
                    }
                }
                setProfile(userProfile)

                // 2. Get Organization if exists
                if (userProfile.orgId) {
                    const orgData = await getOrganization(userProfile.orgId)
                    setOrg(orgData)
                }
            } catch (error) {
                console.error("Error loading profile data:", error)
                toast.error("Failed to load profile data")
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            loadData()
        }
    }, [authUser, authLoading])

    const handleCreateOrg = async () => {
        if (!authUser || !orgName.trim()) return
        setIsCreatingOrg(true)
        try {
            const newOrg = await createOrganization(orgName, authUser)
            setOrg(newOrg)
            setProfile(prev => prev ? ({ ...prev, orgId: newOrg.id }) : null)
            toast.success("Organization created successfully")
        } catch (error) {
            toast.error("Failed to create organization")
        } finally {
            setIsCreatingOrg(false)
        }
    }

    const handleInviteMember = async () => {
        if (!org || !inviteEmail.trim()) return
        setIsInviting(true)
        try {
            await addMemberToOrganization(org.id, inviteEmail)
            // Refresh org data
            const updatedOrg = await getOrganization(org.id)
            setOrg(updatedOrg)
            setInviteEmail("")
            toast.success(`Invited ${inviteEmail} to organization`)
        } catch (error) {
            toast.error("Failed to invite member")
        } finally {
            setIsInviting(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <AuthWrapper>
            <AppLayout>
                <div className="h-full flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-hidden">
                    {/* LEFT COLUMN - IDENTITY & QUICK ACTIONS */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:w-80 flex-shrink-0 flex flex-col gap-6 h-full"
                    >
                        {/* Profile Card */}
                        <div className="rounded-xl border bg-card/50 backdrop-blur p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                            <div className="h-24 w-24 rounded-full border-4 border-background bg-muted flex items-center justify-center mb-4 relative z-10 shadow-xl">
                                {profile?.photoURL ? (
                                    <img src={profile.photoURL} alt="User" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-muted-foreground" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold tracking-tight relative z-10">{profile?.displayName || "Pilot"}</h2>
                            <p className="text-sm font-mono text-muted-foreground relative z-10">{profile?.email}</p>

                            <div className="mt-6 w-full grid grid-cols-2 gap-2 relative z-10">
                                <div className="p-2 rounded bg-background/50 border text-center">
                                    <div className="text-xs text-muted-foreground font-mono uppercase">Role</div>
                                    <div className="font-bold text-primary">ADMIN</div>
                                </div>
                                <div className="p-2 rounded bg-background/50 border text-center">
                                    <div className="text-xs text-muted-foreground font-mono uppercase">Status</div>
                                    <div className="font-bold text-green-500">ACTIVE</div>
                                </div>
                            </div>
                        </div>

                        {/* Org Summary Card - Fixed Left */}
                        <div className="rounded-xl border bg-card/30 backdrop-blur p-6 flex-1 flex flex-col shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                <h3 className="font-bold">Organization</h3>
                            </div>

                            {!org ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                    <p className="text-sm text-muted-foreground">No organization found.</p>
                                    <div className="w-full space-y-2">
                                        <Input
                                            placeholder="Org Name"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            className="text-center"
                                        />
                                        <Button onClick={handleCreateOrg} disabled={isCreatingOrg} className="w-full">
                                            {isCreatingOrg ? "Creating..." : "Create New"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                                        <div className="text-xs text-blue-400 font-mono uppercase mb-1">Current Workspace</div>
                                        <div className="font-bold text-lg">{org.name}</div>
                                        <div className="text-[10px] font-mono text-muted-foreground truncate">{org.id}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Managing {org.members.length} member{org.members.length !== 1 ? 's' : ''}.
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN - DETAILED CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1 min-w-0 h-full flex flex-col"
                    >
                        <div className="rounded-xl border bg-card/40 backdrop-blur flex-1 overflow-hidden flex flex-col shadow-sm">
                            <div className="p-4 border-b flex items-center justify-between bg-card/20 backdrop-blur-md z-10">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <h3 className="font-bold font-mono tracking-wide">TEAM MANAGEMENT</h3>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                    <Users className="h-4 w-4 mr-2" /> Refresh
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar relative">
                                {org ? (
                                    <div className="divide-y divide-white/5">
                                        {/* Add Member Header */}
                                        <div className="p-4 bg-muted/5 sticky top-0 backdrop-blur-sm border-b border-white/5 z-10">
                                            <div className="flex gap-2 max-w-md">
                                                <Input
                                                    placeholder="Invite colleague by email..."
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    className="bg-background/50 border-white/10"
                                                />
                                                <Button onClick={handleInviteMember} disabled={isInviting}>
                                                    {isInviting ? "Sending..." : "Invite"}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Members list */}
                                        {org.members.map((member, idx) => (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center font-bold text-gray-300">
                                                        {member.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{member.email}</div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="capitalize px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{member.role}</span>
                                                            <span>• Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
                                                    <Lock className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                                        <Shield className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Join or create an organization to manage team members.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AppLayout>
        </AuthWrapper>
    )
}
