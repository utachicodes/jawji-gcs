"use client"

import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { PreFlightChecklist } from "@/components/pre-flight-checklist"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function PreflightContent() {
  const searchParams = useSearchParams()
  const missionId = searchParams.get("missionId") || undefined

  return (
    <div className="h-full p-6">
      <PreFlightChecklist missionId={missionId} />
    </div>
  )
}

export default function PreflightPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <Suspense fallback={<div className="p-8">Loading...</div>}>
          <PreflightContent />
        </Suspense>
      </AppLayout>
    </AuthWrapper>
  )
}
