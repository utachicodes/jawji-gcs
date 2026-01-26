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

  // Simulated time for the header clock
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    if (session?.user) {
      setUser({ name: session.user.name || "Operator", email: session.user.email || "operator@jawji.com" })
    } else {
      const userData = typeof window !== "undefined" ? localStorage.getItem("jawji_user") : null
      if (userData) setUser(JSON.parse(userData))
    }

    const interval = setInterval(() => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }, 1000)
    return () => clearInterval(interval)
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

  const getModeColor = (mode: string = "MANUAL") => {
    switch (mode.toUpperCase()) {
      case 'AUTO': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'RTH': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'LOITER': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    }
  }

  return (
    // Reverted to original height and background styles
    <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50 transition-all duration-200">
      {/* Left: Branding & Clock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
            <SidebarIcon className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Restored JAWJI Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="JAWJI Home">
            <Image src="/jawji-logo.png" alt="JAWJI" width={100} height={24} className="h-6 w-auto" priority />
          </Link>
        </div>
      </div>

      {/* Center: Active Asset & Flight Status */}
      <div className="flex-1 flex items-center justify-center px-4">
        {currentDrone ? (
          <div className="flex items-center gap-4 w-full max-w-3xl justify-center">

            {/* Drone Selector - Integrated */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-border/50 bg-background/50 hover:bg-accent/50 rounded-full px-3 hidden md:flex">
                  <div className={`h-2 w-2 rounded-full ${currentDrone.status === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-500"}`} />
                  <span className="text-xs font-semibold">{currentDrone.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">SWITCH DRONE</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {drones.map((drone) => (
                  <DropdownMenuItem key={drone.id} onClick={() => selectDrone(drone.id)}>
                    {drone.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Bar Container */}
            <div className="flex items-center gap-1 bg-accent/20 rounded-full border border-border/50 p-1 px-1 shadow-sm overflow-hidden">

              {/* Flight Mode */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getModeColor(currentDrone.mode)}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                <span className="text-[10px] font-bold font-mono tracking-wider">{currentDrone.mode || "STABILIZE"}</span>
              </div>

              <div className="w-px h-4 bg-border/50 mx-1" />

              {/* Battery */}
              <div className="flex items-center gap-2 px-2 text-foreground/80">
                <div className={currentDrone.battery < 20 ? "text-red-500" : "text-emerald-500"}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2" /><line x1="23" y1="13" x2="23" y2="11" /></svg>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold font-mono">
                    {Math.round(currentDrone.battery)}%
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono">18m</span>
                </div>
              </div>

              <div className="w-px h-4 bg-border/50 mx-1" />

              {/* GNSS */}
              <div className="flex items-center gap-2 px-2 text-foreground/80 hidden sm:flex">
                <div className="text-blue-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold font-mono">
                    {currentDrone.gpsSatellites || 0}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono">SATS</span>
                </div>
              </div>

              <div className="w-px h-4 bg-border/50 mx-1 hidden sm:block" />

              {/* Link Quality */}
              <div className="flex items-center gap-2 px-2 text-foreground/80 hidden sm:flex">
                <div className="text-emerald-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold font-mono">
                    {time.split(' ')[0]} {/* Clock embedded here for efficiency */}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono">24ms</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 opacity-50 bg-accent/20 px-4 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs font-medium">SYSTEM OFFLINE</span>
          </div>
        )}
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-accent/20 rounded-full p-1 border border-border/50">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full p-0 overflow-hidden border border-border/50 hover:border-border transition-all ml-2">
              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {user?.name?.[0] || "O"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2 border-b mb-1">
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
            <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-50" onClick={handleLogout}>
              <Power className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
