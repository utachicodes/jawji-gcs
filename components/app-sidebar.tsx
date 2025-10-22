"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from 'next/navigation'

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
import { LayoutDashboard, Map, Gamepad2, CheckCircle2, FolderTree, Activity, ChartBar, Settings, Users } from "lucide-react"

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

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-[radial-gradient(50%_50%_at_50%_0%,_hsl(var(--primary)/0.08),_transparent_70%)]">
      <SidebarHeader className="border-b border-border/40 bg-card/60 backdrop-blur" />
      <SidebarContent className="bg-card/40">
        <div className="px-3 pt-3 pb-1 text-[10px] tracking-[0.15em] text-muted-foreground font-mono group-data-[collapsible=icon]:hidden">
          NAVIGATION
        </div>
        <SidebarMenu className="gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className="h-11 group data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-accent/60 rounded-lg transition-colors"
                >
                  <Link href={item.url}>
                    <div className="flex items-center gap-3 w-full">
                      <div className={`flex items-center justify-center h-7 w-7 rounded-md border ${active ? 'bg-primary-foreground/10 border-primary-foreground/20' : 'bg-muted/50 border-border/60'} transition-colors` }>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-primary-foreground/10' : 'bg-muted/50'} transition-colors`}>{item.code}</span>
                      </div>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 bg-card/60 backdrop-blur">
        <div className="px-3 py-3 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground group-data-[collapsible=icon]:hidden">LINK</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500 font-semibold group-data-[collapsible=icon]:hidden">ACTIVE</span>
            </div>
          </div>
          {activeDrone && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground group-data-[collapsible=icon]:hidden">PWR</span>
                <div className="flex-1 mx-2 h-1.5 rounded bg-muted/60 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, activeDrone.battery))}%` }} />
                </div>
                <span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden min-w-[2.5rem] text-right">{activeDrone.battery}%</span>
                <div className="hidden group-data-[collapsible=icon]:block h-1.5 w-1.5 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground group-data-[collapsible=icon]:hidden">SIG</span>
                <div className="flex-1 mx-2 h-1.5 rounded bg-muted/60 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, activeDrone.signal))}%` }} />
                </div>
                <span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden min-w-[2.5rem] text-right">{activeDrone.signal}%</span>
                <div className="hidden group-data-[collapsible=icon]:block h-1.5 w-1.5 rounded-full bg-green-500" />
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
