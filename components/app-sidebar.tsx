"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useState, useEffect } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDroneStore } from "@/lib/drone-store"
import { LayoutDashboard, Map, Gamepad2, CheckCircle2, FolderTree, Activity, ChartBar, Settings, Users, Command, Building2 } from "lucide-react"

const navItems = [
  { title: "Flight Operations", url: "/dashboard", code: "FLT", icon: LayoutDashboard },
  { title: "Mission Planning", url: "/missions/new", code: "MSN", icon: Map },
  { title: "Manual Control", url: "/control", code: "CTL", icon: Gamepad2 },
  { title: "Pre-Flight Check", url: "/preflight", code: "PRE", icon: CheckCircle2 },
  { title: "Mission Library", url: "/missions", code: "LIB", icon: FolderTree },
  { title: "Fleet Management", url: "/fleet", code: "FLE", icon: Users },
  { title: "Diagnostics", url: "/diagnostics", code: "DGN", icon: Activity },
  { title: "Analytics", url: "/analytics", code: "ANL", icon: ChartBar },
  { title: "Configuration", url: "/settings", code: "CFG", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; org?: string } | null>(null)

  // Use session if available, fallback to local storage
  // Note: specific import needed for useSession if not already imported, 
  // but we can reuse the logic from status-bar or just rely on local storage for now to avoid complexity if AuthWrapper isn't everywhere.
  // Ideally, use a centralized store or context. For now, mirroring status-bar logic.

  useEffect(() => {
    setMounted(true)
    // Simple user simulation/retrieval
    const userData = typeof window !== "undefined" ? localStorage.getItem("jawji_user") : null
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      setUser({ name: "Abdoullah Al-Jerrari", email: "adboulah@jawji.com", org: "adboulah_5089" })
    }
  }, [])

  if (!mounted) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="border-b border-sidebar-border p-4 flex items-center justify-center h-16">
          {/* Static placeholder header */}
        </SidebarHeader>
        <SidebarContent />
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border p-4 flex items-center justify-center h-16 transition-all">
        <div className="flex items-center gap-2 w-full justify-center">
          <div className="relative h-8 w-32 group-data-[collapsible=icon]:w-8 transition-all duration-300">
            <Image
              src="/jawji-logo.png"
              alt="JAWJI"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 gap-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={`
                    h-12 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <Link href={item.url} className="flex items-center gap-4 px-3">
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                    )}
                    <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span className="font-medium tracking-wide text-sm group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0 bg-sidebar-muted/20">

        {/* Organization Section (Inspired by CAYTU) */}
        <div className="p-4 group-data-[collapsible=icon]:p-2 transition-all">
          <Link href="/profile">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center cursor-pointer group">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:bg-blue-700 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>

              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden transition-all duration-300 ease-in-out">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider group-hover:text-primary transition-colors">Organization</span>
                <span className="text-sm font-bold text-sidebar-foreground truncate group-hover:underline decoration-primary underline-offset-4">{user?.org || "Current Org."}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.name || "User"}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* System Status (Visible only when expanded for clarity, or small dot when collapsed) */}
        {activeDrone && (
          <div className="px-4 pb-4 group-data-[collapsible=icon]:hidden">
            <div className="bg-card/50 rounded-lg p-3 border border-border space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <span>System Status</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/80 rounded p-1 text-center border border-border">
                  <span className="text-[10px] text-muted-foreground block">BAT</span>
                  <span className={`text-xs font-mono font-bold ${activeDrone.battery < 20 ? 'text-red-500' : 'text-green-500'}`}>{activeDrone.battery}%</span>
                </div>
                <div className="bg-background/80 rounded p-1 text-center border border-border">
                  <span className="text-[10px] text-muted-foreground block">SIG</span>
                  <span className="text-xs font-mono font-bold text-blue-500">{activeDrone.signal}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
