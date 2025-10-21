"use client"

import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const MissionPlanning = dynamic(() => import("@/components/mission-planning").then((m) => m.MissionPlanning), {
  ssr: false,
  loading: () => null,
})

export default function MissionPlanningPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <MissionPlanning />
      </AppLayout>
    </AuthWrapper>
  )
}
