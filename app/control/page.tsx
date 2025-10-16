"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DroneControl } from "@/components/drone-control"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

function ControlContent() {
  const searchParams = useSearchParams()
  const isEmergency = searchParams.get("emergency") === "true"

  return (
    <AppLayout>
      {isEmergency && (
        <div className="absolute top-0 left-0 right-0 z-40 p-4">
          <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-semibold">
              EMERGENCY CONTROL MODE - Unauthorized access for emergency situations only
            </AlertDescription>
          </Alert>
        </div>
      )}
      <DroneControl />
    </AppLayout>
  )
}

export default function ControlPage() {
  return (
    <AuthWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <ControlContent />
      </Suspense>
    </AuthWrapper>
  )
}
