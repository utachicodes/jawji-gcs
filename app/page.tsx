// <CHANGE> Changed main page to show unified dashboard instead of mission planning
import { UnifiedDashboard } from "@/components/unified-dashboard"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function Home() {
  return (
    <AuthWrapper>
      <AppLayout>
        <UnifiedDashboard />
      </AppLayout>
    </AuthWrapper>
  )
}
