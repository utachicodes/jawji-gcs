"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const publicRoutes = ["/login", "/signup", "/forgot-password"]
    const isPublicRoute = publicRoutes.includes(pathname)

    const isEmergencyMode = searchParams.get("emergency") === "true"
    const isControlPage = pathname === "/control"

    const token = localStorage.getItem("jawji_auth_token")

    if (!token && !isPublicRoute && !(isControlPage && isEmergencyMode)) {
      router.push("/login")
    } else if (token && isPublicRoute) {
      router.push("/")
    } else {
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [pathname, router, searchParams])

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
