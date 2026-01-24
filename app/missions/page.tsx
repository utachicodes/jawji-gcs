"use client"
import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const MissionLibrary = dynamic(() => import("@/components/mission-library").then((m) => m.MissionLibrary), {
  ssr: false,
  loading: () => null,
})

export default function MissionsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <MissionLibrary />
      </AppLayout>
    </AuthWrapper>
  )
}
