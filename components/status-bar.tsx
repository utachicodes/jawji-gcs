"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, User, Power, Moon, Sun, Monitor, ChevronDown, SidebarIcon, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { useDroneStore } from "@/lib/drone-store"
import type { Drone } from "@/lib/drone-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useFirebaseAuth } from "@/lib/auth-service"
import { getUserProfile } from "@/lib/firestore-service"

export function StatusBar() {
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { drones, selectedDrone, selectDrone } = useDroneStore()
  // const { data: session } = useSession() // We keep this for UI if needed, but adding real hook below
  const { data: session } = useSession()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({ name: session.user.name || "Operator", email: session.user.email || "operator@jawji.com" })
      return
    }
    const userData = typeof window !== "undefined" ? localStorage.getItem("jawji_user") : null
    if (userData) setUser(JSON.parse(userData))
  }, [session])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jawji_auth_token")
      localStorage.removeItem("jawji_user")
    }
    try {
      signOut({ callbackUrl: "/login" })
    } catch {
      router.push("/login")
    }
  }

  const currentDrone = drones.find((d: Drone) => d.id === selectedDrone)

  useEffect(() => {
    const initData = async () => {
      if (!user || !user.email) return

      // Ensure profile exists or get org
      const profile = await getUserProfile(session?.user?.id || "") // Note: session.user.id might be undefined if not in session callback
      // Ideally we rely on auth-service user, but here we can hack:
      // If we have an email, try to find user profile by ID if we had it, or just rely on manual refresh for now.
      // Better: Status Bar should rely on useFirebaseAuth.
    }
  }, [user])

  // Replace session with useFirebaseAuth
  const { user: authUser } = useFirebaseAuth();
  const { fetchDrones } = useDroneStore();

  useEffect(() => {
    const loadFleet = async () => {
      if (authUser) {
        const profile = await getUserProfile(authUser.uid);
        if (profile?.orgId) {
          await fetchDrones(profile.orgId);
        }
      }
    }
    loadFleet();
  }, [authUser, fetchDrones]);

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur z-40 shrink-0 sticky top-0">


      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
          <SidebarIcon className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">Dashboard Console</h1>
          <p className="text-[10px] text-muted-foreground font-mono">JAWJI GCS v2.0</p>
        </div>
      </div>

      {/* Center: Global Search (Command+K style) */}
      {/* Spacer where Search Bar was */}
      <div className="flex-1" />

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2">

        {/* Drone Selector Pill - Moved to right for cleaner center */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden lg:flex h-9 rounded-full bg-card border-input px-3 gap-2 text-foreground mr-2">
              <div className={`w-2 h-2 rounded-full ${currentDrone?.status === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
              <span className="font-medium text-xs truncate max-w-[100px]">{currentDrone?.name || "No Drone"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Select Active Unit</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {drones.map((drone: Drone) => (
              <DropdownMenuItem key={drone.id} onClick={() => selectDrone(drone.id)}>
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${drone.status === "online" ? "bg-green-500" : "bg-zinc-500"}`} />
                  <span>{drone.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 ml-2 cursor-pointer hover:bg-accent/50 p-1.5 rounded-full transition-colors">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-foreground leading-none">{user?.name || "Operator"}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-1">{user?.email?.split('@')[0] || "admin"}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-background shadow-lg">
                {user?.name?.charAt(0) || "O"}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "Operator"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "operator@jawji.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <Monitor className="w-4 h-4 mr-2" /> Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleLogout}>
              <Power className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
