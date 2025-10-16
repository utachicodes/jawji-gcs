import { Settings } from "@/components/settings"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <Settings />
      </AppLayout>
    </AuthWrapper>
  )
}
