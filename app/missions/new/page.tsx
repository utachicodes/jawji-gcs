"use client"

import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const MissionWizard = dynamic(() => import("@/components/mission-wizard").then((m) => m.MissionWizard), {
  ssr: false,
  loading: () => null,
})

export default function MissionNewPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <MissionWizard />
      </AppLayout>
    </AuthWrapper>
  )
}
