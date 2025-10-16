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

const navItems = [
  {
    title: "Flight Operations",
    url: "/dashboard",
    code: "FLT",
  },
  {
    title: "Mission Planning",
    url: "/",
    code: "MSN",
  },
  {
    title: "Manual Control",
    url: "/control",
    code: "CTL",
  },
  {
    title: "Pre-Flight Check",
    url: "/preflight",
    code: "PRE",
  },
  {
    title: "Mission Library",
    url: "/missions",
    code: "LIB",
  },
  {
    title: "Diagnostics",
    url: "/diagnostics",
    code: "DGN",
  },
  {
    title: "Analytics",
    url: "/analytics",
    code: "ANL",
  },
  {
    title: "Configuration",
    url: "/settings",
    code: "CFG",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { drones, selectedDrone } = useDroneStore()
  const activeDrone = drones.find((d) => d.id === selectedDrone)

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 bg-card/50">
        <div className="flex items-center justify-center px-4 py-4">
          <Image
            src="/jawji-logo.png"
            alt="JAWJI"
            width={120}
            height={40}
            className="h-8 w-auto group-data-[collapsible=icon]:hidden"
          />
          <Image
            src="/jawji-logo.png"
            alt="J"
            width={32}
            height={32}
            className="hidden group-data-[collapsible=icon]:block h-8 w-8 object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-card/30">
        <SidebarMenu className="gap-1 p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="h-11 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-accent/50"
              >
                <Link href={item.url}>
                  <div className="flex items-center gap-3 w-full">
                    <div className="font-mono text-xs font-bold min-w-[2.5rem] text-center px-1.5 py-0.5 rounded bg-muted/50 group-data-[collapsible=icon]:min-w-0">
                      {item.code}
                    </div>
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 bg-card/50">
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
                <span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden">
                  {activeDrone.battery}%
                </span>
                <div className="hidden group-data-[collapsible=icon]:block h-1.5 w-1.5 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground group-data-[collapsible=icon]:hidden">SIG</span>
                <span className="text-foreground font-semibold group-data-[collapsible=icon]:hidden">
                  {activeDrone.signal}%
                </span>
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
