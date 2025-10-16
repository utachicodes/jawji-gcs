import { Analytics } from "@/components/analytics"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function AnalyticsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <Analytics />
      </AppLayout>
    </AuthWrapper>
  )
}
