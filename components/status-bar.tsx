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
    <div className="h-16 md:h-20 border-b border-white/10 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon className="h-4 w-4" />
        </Button>

        <Link href="/" className="flex items-center gap-2" aria-label="JAWJI Home">
          <Image src="/jawji-logo.png" alt="JAWJI" width={180} height={40} className="h-8 md:h-10 w-auto" priority />
        </Link>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground/90">System Online</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <span className="text-sm text-muted-foreground">Drone:</span>
              <span className="text-sm font-mono">{currentDrone?.name || "No Drone"}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Select Drone</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {drones.map((drone: Drone) => (
              <DropdownMenuItem
                key={drone.id}
                onClick={() => selectDrone(drone.id)}
                className={selectedDrone === drone.id ? "bg-accent" : ""}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${drone.status === "online" ? "bg-green-500" : "bg-gray-500"}`}
                  />
                  <span className="font-mono">{drone.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings?tab=fleet")}>Manage Drones</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div>
            Mode: <span className="text-foreground">{currentDrone?.mode || "N/A"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-mono">Batt {Math.round(currentDrone?.battery ?? 0)}%</span>
            <span className="font-mono">Sig {Math.round(currentDrone?.signal ?? 0)}%</span>
            <span className="font-mono">
              Alt {currentDrone?.location ? Math.round(currentDrone.location.altitude) : 0}m
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "Operator"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "operator@jawji.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings?tab=preferences")}>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <Power className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
