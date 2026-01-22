"use client"

import { Activity } from "lucide-react"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function DiagnosticsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/5">
            <Activity className="w-8 h-8 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold">System Diagnostics</h1>
          <p className="text-zinc-400 max-w-md">Real-time system monitoring and error logging will appear here.</p>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
