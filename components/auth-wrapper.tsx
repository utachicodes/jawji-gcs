"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useFirebaseAuth } from "@/lib/auth-service"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading } = useFirebaseAuth()

  useEffect(() => {
    console.log("[AuthWrapper] Pathname:", pathname, "Loading:", loading, "User:", user?.email)

    if (loading) return

    const publicRoutes = ["/login", "/signup", "/forgot-password"]
    const isPublicRoute = publicRoutes.includes(pathname)
    const isEmergencyMode = searchParams.get("emergency") === "true"
    const isControlPage = pathname === "/control"

    if (!user && !isPublicRoute && !(isControlPage && isEmergencyMode)) {
      console.log("[AuthWrapper] Not authenticated, redirecting to /login")
      router.push("/login")
    } else if (user && isPublicRoute) {
      console.log("[AuthWrapper] Authenticated, redirecting to /")
      router.push("/")
    }

  }, [pathname, router, searchParams, user, loading])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If not authenticated and not public, we rendered nothing while redirecting
  // But due to the useEffect, we might render children briefly.
  // Ideally, we return null if !user && !public
  const publicRoutes = ["/login", "/signup", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(pathname)
  const isEmergencyMode = searchParams.get("emergency") === "true"
  const isControlPage = pathname === "/control"

  if (!user && !isPublicRoute && !(isControlPage && isEmergencyMode)) {
    return null
  }

  return <>{children}</>
}
