"use client"

import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { PreFlightChecklist } from "@/components/pre-flight-checklist"
import { useSearchParams } from "next/navigation"
import React from "react"

export default function PreFlightPage() {
  const params = useSearchParams()
  const missionId = params.get("missionId") || undefined
  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-mono">PRE-FLIGHT CHECKLIST</h1>
              <p className="text-muted-foreground mt-2 font-mono">
                Complete all critical checks before flight operations
              </p>
            </div>
            <PreFlightChecklist missionId={missionId} />
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
