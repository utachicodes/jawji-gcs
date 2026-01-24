"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Github, Mail } from "lucide-react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Store auth token (in real app, this would come from backend)
    localStorage.setItem("jawji_auth_token", "demo_token_" + Date.now())
    localStorage.setItem("jawji_user", JSON.stringify({ email: formData.email, name: "Demo User" }))

    setIsLoading(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(120%_60%_at_50%_0%,_hsl(var(--primary)/0.12),_transparent_60%)] bg-background">
      <div className="w-full max-w-2xl">
        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center">
            <Image src="/jawji-logo.png" alt="JAWJI" width={220} height={73} className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Log in to your account</h1>
          <p className="text-base text-muted-foreground">Access your JAWJI Ground Control Station</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base bg-transparent"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <Mail className="h-5 w-5 mr-2" /> Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base bg-transparent"
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            <Github className="h-5 w-5 mr-2" /> Continue with GitHub
          </Button>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">Or continue with</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Username or Email</Label>
            <Input
              id="email"
              type="text"
              placeholder="Eg: testUser or pilot@jawji.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary/70 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Join us</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
