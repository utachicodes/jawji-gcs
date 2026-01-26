"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, User, Power, Moon, Sun, Monitor, ChevronDown, SidebarIcon } from "lucide-react"
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

export function StatusBar() {
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { drones, selectedDrone, selectDrone } = useDroneStore()
  const { data: session } = useSession()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    // Prefer NextAuth session if available; fallback to legacy local storage
    if (session?.user) {
      setUser({ name: session.user.name || "Operator", email: session.user.email || "operator@jawji.com" })
      return
    }
    const userData = typeof window !== "undefined" ? localStorage.getItem("jawji_user") : null
    if (userData) setUser(JSON.parse(userData))
  }, [session])

  const handleLogout = () => {
    // Clear legacy local storage and sign out via NextAuth when present
    if (typeof window !== "undefined") {
      localStorage.removeItem("jawji_auth_token")
      localStorage.removeItem("jawji_user")
    }
    // Use NextAuth signOut to clear session; fallback navigate
    try {
      signOut({ callbackUrl: "/login" })
    } catch {
      router.push("/login")
    }
  }

  const currentDrone = drones.find((d: Drone) => d.id === selectedDrone)

  return (
    <header className="h-14 border-b border-white/5 bg-background/60 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50 transition-all duration-200">
      {/* Left: Navigation & Branding */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
          <SidebarIcon className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="JAWJI Home">
          <Image src="/jawji-logo.png" alt="JAWJI" width={100} height={24} className="h-6 w-auto" priority />
        </Link>
      </div>

      {/* Center: Drone Control & Status (Hidden on very small screens) */}
      <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 gap-4">
        {/* Drone Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-full px-4">
              <div className={`h-1.5 w-1.5 rounded-full ${currentDrone?.status === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-500"}`} />
              <span className="text-xs font-medium tracking-wide">{currentDrone?.name || "No Drone"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">SELECT ACTIVE DRONE</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {drones.map((drone: Drone) => (
              <DropdownMenuItem
                key={drone.id}
                onClick={() => selectDrone(drone.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${drone.status === "online" ? "bg-emerald-500" : "bg-zinc-500"}`} />
                  <span className="font-mono text-xs">{drone.name}</span>
                </div>
                {selectedDrone === drone.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings?tab=fleet")} className="text-xs">Manage Fleet</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 text-[10px] font-mono font-medium text-muted-foreground bg-white/5 rounded-full px-3 py-1 border border-white/5">
          <div className="flex items-center gap-1.5 px-2 border-r border-white/5">
            <span className={currentDrone?.battery > 20 ? "text-emerald-400" : "text-red-400"}>BAT {Math.round(currentDrone?.battery ?? 0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 border-r border-white/5">
            <span>SIG {Math.round(currentDrone?.signal ?? 0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2">
            <span>ALT {Math.round(currentDrone?.location?.altitude ?? 0)}m</span>
          </div>
        </div>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
            <Bell className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 overflow-hidden border border-white/10 hover:border-white/20 transition-all">
              <div className="h-full w-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.[0] || "O"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2 border-b border-white/5 mb-1">
              <p className="text-sm font-medium">{user?.name || "Operator"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "operator@jawji.com"}</p>
            </div>
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="h-4 w-4 mr-2 text-muted-foreground" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Monitor className="h-4 w-4 mr-2 text-muted-foreground" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-950/20" onClick={handleLogout}>
              <Power className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
