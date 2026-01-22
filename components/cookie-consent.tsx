"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Cookie, ShieldCheck } from "lucide-react"

export function CookieConsent() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem("jawji_cookie_consent")
        if (!consent) {
            // Small delay for better UX on entry
            const timer = setTimeout(() => setShow(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem("jawji_cookie_consent", "true")
        setShow(false)
    }

    const handleDecline = () => {
        localStorage.setItem("jawji_cookie_consent", "false")
        setShow(false)
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[9999] md:max-w-md"
                >
                    <div className="bg-background/80 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-2xl flex flex-col gap-4 relative overflow-hidden group">

                        {/* Decorative glint */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-start gap-4 relative z-10">
                            <div className="p-3 bg-secondary/50 rounded-xl">
                                <Cookie className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg leading-tight">We value your privacy</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We use cookies to enhance your experience, analyze platform performance, and ensure secure access.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                variant="ghost"
                                onClick={handleDecline}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Decline
                            </Button>
                            <Button
                                onClick={handleAccept}
                                className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold"
                            >
                                Accept All
                            </Button>
                        </div>

                        {/* Bottom secure badge */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-20">
                            <ShieldCheck className="w-3 h-3" />
                            <span className="text-[9px] font-mono uppercase tracking-widest">Secure</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
