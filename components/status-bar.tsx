"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, User, Power, Moon, Sun, Monitor, ChevronDown, SidebarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { useDroneStore } from "@/lib/drone-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function StatusBar() {
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { drones, selectedDrone, selectDrone } = useDroneStore()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("jawji_user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("jawji_auth_token")
    localStorage.removeItem("jawji_user")
    router.push("/login")
  }

  const currentDrone = drones.find((d) => d.id === selectedDrone)

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">System Online</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="text-sm text-muted-foreground">Drone:</span>
              <span className="text-sm font-mono">{currentDrone?.name || "No Drone"}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Select Drone</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {drones.map((drone) => (
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
            <DropdownMenuItem onClick={() => router.push("/settings?tab=drones")}>Manage Drones</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="text-sm text-muted-foreground">
          Mode: <span className="text-foreground">{currentDrone?.mode || "N/A"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="h-4 w-4 mr-2" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
