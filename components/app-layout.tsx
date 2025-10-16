"use client"

import type React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { StatusBar } from "@/components/status-bar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <StatusBar />
          <main className="flex-1 overflow-auto relative">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
