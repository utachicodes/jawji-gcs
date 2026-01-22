"use client"

import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const FleetView = dynamic(() => import("@/components/fleet-view"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading Fleet Management...</div>,
})

export default function FleetPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <FleetView />
      </AppLayout>
    </AuthWrapper>
  )
}
