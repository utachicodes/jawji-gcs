"use client"
import dynamic from "next/dynamic"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

const Analytics = dynamic(() => import("@/components/analytics").then((m) => m.Analytics), {
  ssr: false,
  loading: () => null,
})

export default function AnalyticsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <Analytics />
      </AppLayout>
    </AuthWrapper>
  )
}
