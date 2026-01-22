import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useFirebaseAuth } from "@/lib/auth-service"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Use Firebase Auth Hook
  const { user, loading } = useFirebaseAuth()

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/signup", "/forgot-password"]
    const isPublicRoute = publicRoutes.includes(pathname)
    const isEmergencyMode = searchParams.get("emergency") === "true"
    const isControlPage = pathname === "/control"
    const isAuthed = !!user

    if (!isAuthed && !isPublicRoute && !(isControlPage && isEmergencyMode)) {
      router.push("/login")
    } else if (isAuthed && isPublicRoute) {
      router.push("/")
    } else if (isAuthed && user) {
      // Ensure user has an organization
      import("@/lib/firestore-service").then(async ({ getUserProfile, createOrganization }) => {
        const profile = await getUserProfile(user.uid)
        if (!profile?.orgId) {
          console.log("User has no org, creating default...")
          await createOrganization(`${user.displayName || "My"}'s Organization`, user)
          console.log("Default org created.")
        }
      })
    }

  }, [pathname, router, searchParams, user, loading])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If not authenticated and not on public route (and check passed above), don't render children yet (router will push)
  // But wait, the useEffect pushes. We should return null here if supposed to redirect.
  // Actually simpler: if !user && strict_route return null.

  const publicRoutes = ["/login", "/signup", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(pathname)
  const isEmergencyMode = searchParams.get("emergency") === "true"
  const isControlPage = pathname === "/control"

  if (!user && !isPublicRoute && !(isControlPage && isEmergencyMode)) {
    return null;
  }

  return <>{children}</>
}
