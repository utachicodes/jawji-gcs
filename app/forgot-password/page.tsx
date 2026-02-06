"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { resetPassword } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setSuccessMessage("")
        setErrorMessage("")

        try {
            await resetPassword(email)
            setSuccessMessage("Check your email for password reset instructions.")
        } catch (error: any) {
            console.error(error)
            const msg = error.code ? `Error (${error.code}): ${error.message}` : error.message;
            setErrorMessage(msg || "Failed to send reset email")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(120%_60%_at_50%_0%,_hsl(var(--primary)/0.12),_transparent_60%)] bg-background">
            <div className="w-full max-w-lg">
                <div className="text-center space-y-3 mb-8">
                    <div className="flex justify-center">
                        <Image src="/jawji-logo.png" alt="JAWJI" width={220} height={73} className="h-16 w-auto" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
                    <p className="text-base text-muted-foreground">Enter your email to receive reset instructions</p>
                </div>

                <form onSubmit={handleReset} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
                    {successMessage && (
                        <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm border border-green-500/20">
                            {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending email...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-primary hover:underline text-sm flex items-center justify-center">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
