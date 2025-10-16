import { AuthWrapper } from "@/components/auth-wrapper"
import { PreFlightChecklist } from "@/components/pre-flight-checklist"

export default function PreFlightPage() {
  return (
    <AuthWrapper>
      <div className="h-full p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-mono">PRE-FLIGHT CHECKLIST</h1>
            <p className="text-muted-foreground mt-2 font-mono">
              Complete all critical checks before flight operations
            </p>
          </div>
          <PreFlightChecklist />
        </div>
      </div>
    </AuthWrapper>
  )
}
