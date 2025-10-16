import { MissionLibrary } from "@/components/mission-library"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function MissionsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <MissionLibrary />
      </AppLayout>
    </AuthWrapper>
  )
}
