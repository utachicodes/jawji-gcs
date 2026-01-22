"use client"

import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { MissionLibrary } from "@/components/mission-library"

export default function MissionLibraryPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <MissionLibrary />
      </AppLayout>
    </AuthWrapper>
  )
}
