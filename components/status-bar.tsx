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
      let name = session.user.name || "Operator"
      if (name === "Operator" && session.user.email) {
        name = session.user.email.split("@")[0]
      }
      setUser({ name, email: session.user.email || "operator@jawji.com" })
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

  return (
    <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-200">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
          <SidebarIcon className="h-4 w-4" />
        </Button>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/jawji-logo.png" alt="JAWJI" width={160} height={44} className="h-11 w-auto" priority />
        </Link>
      </div>

      {/* Right: Status, Actions & User */}
      <div className="flex items-center gap-6">

        {/* Simplified Status Indicators (No Badges) */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-foreground/80">

          {/* Flight Mode */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">MODE</span>
            <span className={currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? "text-foreground font-bold" : "text-muted-foreground"}>
              {currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? currentDrone.mode : "---"}
            </span>
          </div>

          {/* Battery */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">BAT</span>
            <div className={`flex items-center gap-1 ${currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? (currentDrone.battery < 20 ? "text-red-500" : "text-emerald-500") : "text-muted-foreground"}`}>
              <span className="font-bold">{currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? Math.round(currentDrone.battery) + "%" : "---"}</span>
            </div>
          </div>

          {/* Satellites */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">GPS</span>
            <span className="font-bold">{currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? (currentDrone.gpsSatellites || 0) : "---"}</span>
          </div>

          {/* Link & Time */}
          <div className="flex items-center gap-4 border-l border-border pl-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">LINK</span>
              <span className={currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? "text-emerald-500 font-bold" : "text-muted-foreground"}>
                {currentDrone && (currentDrone.status === "online" || currentDrone.status === "flying") ? "24ms" : "---"}
              </span>
            </div>
            <div className="font-mono text-muted-foreground font-medium">
              {time.split(' ')[0] || "00:00:00"}
            </div>
          </div>

        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* User Profile - Clean & Simple */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold leading-none">{user?.name || "Operator"}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-2 ring-background">
                <User className="h-4 w-4" />
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
