"use client"

import type React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { StatusBar } from "@/components/status-bar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {/* Ambient background layer */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,_rgba(var(--primary-rgb),0.06),_transparent_70%),radial-gradient(900px_500px_at_0%_100%,_rgba(var(--primary-rgb),0.04),_transparent_70%)] dark:bg-[radial-gradient(1200px_600px_at_80%_-10%,_rgba(255,255,255,0.06),_transparent_70%),radial-gradient(900px_500px_at_0%_100%,_rgba(255,255,255,0.04),_transparent_70%)]"
          />
          <StatusBar />
          {/* Main content with top padding for fixed header */}
          <main className="flex-1 overflow-hidden relative p-2 h-full min-h-0">
            {/* Vignette edge fade for cinematic look - Only in dark mode */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 dark:bg-[radial-gradient(80%_80%_at_50%_0%,_transparent_40%,_rgba(0,0,0,0.25)_100%)]" />
            <div className="relative mx-auto flex h-full w-full max-w-[1920px] flex-col overflow-hidden min-h-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
