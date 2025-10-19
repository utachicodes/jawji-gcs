import FleetView from "@/components/fleet-view"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function FleetPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <FleetView />
      </AppLayout>
    </AuthWrapper>
  )
}
