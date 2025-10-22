"use client"
import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const UnifiedDashboard = dynamic(
  () => import("@/components/unified-dashboard").then((m) => m.UnifiedDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 h-full">
        <div className="grid grid-cols-12 grid-rows-12 gap-4 h-[80vh]">
          <div className="col-span-7 row-span-7 rounded-lg border border-border/40 bg-muted/40 animate-pulse" />
          <div className="col-span-5 row-span-7 rounded-lg border border-border/40 bg-muted/40 animate-pulse" />
          <div className="col-span-5 row-span-5 rounded-lg border border-border/40 bg-muted/30 animate-pulse" />
          <div className="col-span-4 row-span-5 rounded-lg border border-border/40 bg-muted/30 animate-pulse" />
          <div className="col-span-3 row-span-5 rounded-lg border border-border/40 bg-muted/30 animate-pulse" />
        </div>
      </div>
    ),
  },
)

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <UnifiedDashboard />
      </AppLayout>
    </AuthWrapper>
  )
}
