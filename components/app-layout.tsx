"use client"

import type React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { StatusBar } from "@/components/status-bar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <StatusBar />
          {/* Ambient background layer */}
          <main className="flex-1 relative flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col w-full h-full max-w-[1700px] mx-auto px-2 py-2 sm:px-4 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
