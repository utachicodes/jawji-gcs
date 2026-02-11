"use client"
// <CHANGE> Changed main page to show unified dashboard instead of mission planning
import dynamic from "next/dynamic"
import { AppLayout } from "@/components/app-layout"

const UnifiedDashboard = dynamic(
  () => import("@/components/unified-dashboard").then((m) => m.UnifiedDashboard),
  { ssr: false, loading: () => null }
)

export default function Home() {
  return (
    <AppLayout>
      <UnifiedDashboard />
    </AppLayout>
  )
}
