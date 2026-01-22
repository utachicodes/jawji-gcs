import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { TelemetryBootstrap } from "@/components/telemetry-bootstrap"
import { PwaBootstrap } from "@/components/pwa-bootstrap"
import { AuthSessionProvider } from "@/components/auth-session-provider"
import { CookieConsent } from "@/components/cookie-consent"

export const metadata: Metadata = {
  title: "JAWJI Ground Control Station",
  description: "AI-Powered GPS-Free Autonomous Drone Control System",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/jawji-logo.png",
    shortcut: "/jawji-logo.png",
    apple: "/jawji-logo.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0F1A",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`h-[100dvh] w-screen overflow-hidden bg-background text-foreground antialiased font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="jawji-theme">
            <Suspense fallback={null}>
              {children}
              <Analytics />
              <Toaster richColors position="top-right" />
            </Suspense>
            <TelemetryBootstrap />
            <PwaBootstrap />
            <CookieConsent />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
