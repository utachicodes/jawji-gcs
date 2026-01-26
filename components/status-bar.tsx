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
      case 'AUTO': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'RTH': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'LOITER': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    }
  }

  return (
    <header className="h-20 border-b border-border/40 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-200 shadow-sm">
      {/* Left: Branding & Clock */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground hidden lg:flex">
            <SidebarIcon className="h-4 w-4" />
          </Button>

          <Link href="/" className="flex items-center gap-3 group" aria-label="JAWJI Home">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full group-hover:bg-orange-500/30 transition-colors blur-sm" />
              <div className="relative w-full h-full text-orange-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.1 1.1 0 0 0 .33 1.21c.21.19.22.47.02.68l-2 2a.98.98 0 0 1-1.25.13l-1.4-.8a6 6 0 0 0-2.3 0l-1.42.82a1 1 0 0 1-1.25-.13l-2-2a.96.96 0 0 1 .03-.68l.8-.5a6 6 0 0 0 0-2.3l-.8-.5a1.1 1.1 0 0 0-.34-1.21L6.6 9.4a.98.98 0 0 1 .02-.68l2-2a.98.98 0 0 1 1.25-.13l1.4.8a6 6 0 0 0 2.3 0l1.42-.82a1 1 0 0 1 1.25.13l2 2a.96.96 0 0 1-.03.68l-.8.5a6 6 0 0 0 0 2.3z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-none">AG.DRONE</span>
              <span className="text-[10px] text-orange-500 font-bold tracking-[0.2em] leading-none mt-1">GROUND CONTROL</span>
            </div>
          </Link>
        </div>

        <div className="h-8 w-px bg-white/10 hidden xl:block" />

        <div className="hidden xl:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
          <span className="text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </span>
          <span className="font-mono text-sm font-bold text-white tracking-widest">{time || "00:00:00"}</span>
        </div>
      </div>

      {/* Center: Active Asset & Flight Status */}
      <div className="flex-1 flex items-center justify-center px-8">
        {currentDrone ? (
          <div className="flex items-center gap-6 w-full max-w-4xl justify-between">
            {/* Active Asset Badge */}
            <div className="hidden lg:flex flex-col items-start min-w-[140px]">
              <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-0.5">ACTIVE ASSET</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-bold text-base flex items-center gap-2 text-white">
                    {currentDrone.name}
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-muted-foreground border border-white/5 font-mono">{currentDrone.model || "ALPHA-01"}</span>
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
            </div>

            <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-1 flex items-center justify-between gap-4 h-12 px-4 shadow-inner">
              {/* Flight Mode */}
              <div className="flex items-center gap-3 border-r border-white/5 pr-4 flex-1">
                <div className="text-orange-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">FLIGHT MODE</span>
                  <span className={`text-xs font-bold font-mono tracking-wide ${getModeColor(currentDrone.mode).split(' ')[0]}`}>
                    {currentDrone.mode || "STABILIZE"}
                  </span>
                </div>
              </div>

              {/* Battery */}
              <div className="flex items-center gap-3 border-r border-white/5 pr-4 flex-1">
                <div className={currentDrone.battery < 20 ? "text-red-500" : "text-emerald-500"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2" /><line x1="23" y1="13" x2="23" y2="11" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">BATTERY</span>
                  <span className="text-xs font-bold font-mono text-white">
                    {Math.round(currentDrone.battery)}% <span className="text-muted-foreground mx-1">•</span> 18min
                  </span>
                </div>
              </div>

              {/* GNSS */}
              <div className="flex items-center gap-3 border-r border-white/5 pr-4 flex-1 hidden xl:flex">
                <div className="text-blue-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">GNSS</span>
                  <span className="text-xs font-bold font-mono text-white">
                    {currentDrone.gpsSatellites || 0} SATS
                  </span>
                </div>
              </div>

              {/* Distance */}
              <div className="flex items-center gap-3 flex-1 hidden 2xl:flex">
                <div className="text-purple-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.1 1.1 0 0 0 .33 1.21c.21.19.22.47.02.68l-2 2a.98.98 0 0 1-1.25.13l-1.4-.8a6 6 0 0 0-2.3 0l-1.42.82a1 1 0 0 1-1.25-.13l-2-2a.96.96 0 0 1 .03-.68l.8-.5a6 6 0 0 0 0-2.3l-.8-.5a1.1 1.1 0 0 0-.34-1.21L6.6 9.4a.98.98 0 0 1 .02-.68l2-2a.98.98 0 0 1 1.25-.13l1.4.8a6 6 0 0 0 2.3 0l1.42-.82a1 1 0 0 1 1.25.13l2 2a.96.96 0 0 1-.03.68l-.8.5a6 6 0 0 0 0 2.3z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">DISTANCE</span>
                  <span className="text-xs font-bold font-mono text-white">
                    243.4 M
                  </span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 opacity-50">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs">NO DRONE CONNECTED</span>
          </div>
        )}
      </div>

      {/* Right: Link Quality & User */}
      <div className="flex items-center gap-6">
        {/* Link Quality */}
        {currentDrone && (
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-500 tracking-wider">LINK QUALITY</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Latency: 24ms</span>
          </div>
        )}

        <div className="h-8 w-px bg-white/10 hidden md:block" />

        {/* User Profile */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 pr-2 pl-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold leading-none">{user?.name || "Operator"}</span>
                  <span className="text-[9px] text-muted-foreground leading-none">ADMIN</span>
                </div>
                <div className="h-6 w-6 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
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
      </div>
    </header>
  )
}
