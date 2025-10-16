import { UnifiedDashboard } from "@/components/unified-dashboard"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <UnifiedDashboard />
      </AppLayout>
    </AuthWrapper>
  )
}
