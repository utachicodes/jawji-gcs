"use client"
import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const UnifiedDashboard = dynamic(
  () => import("@/components/unified-dashboard").then((m) => m.UnifiedDashboard),
  { ssr: false, loading: () => null },
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
