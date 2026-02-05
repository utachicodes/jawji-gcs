"use client"

import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMissionStore } from "@/lib/mission-store"
import { toast } from "sonner"

interface EmergencyAbortProps {
    className?: string
}

export function EmergencyAbort({ className = "" }: EmergencyAbortProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [confirmProgress, setConfirmProgress] = useState(0)
    const [isHolding, setIsHolding] = useState(false)
    const activeMissionId = useMissionStore((s) => s.activeMissionId)
    const abortMission = useMissionStore((s) => s.abortMission)

    const handleAbortClick = () => {
        if (!activeMissionId) {
            toast.error("No active mission to abort")
            return
        }
        setShowDialog(true)
    }

    const handleMouseDown = () => {
        setIsHolding(true)
        let progress = 0
        const interval = setInterval(() => {
            progress += 10
            setConfirmProgress(progress)
            if (progress >= 100) {
                clearInterval(interval)
                executeAbort()
            }
        }, 100)

        const handleMouseUp = () => {
            clearInterval(interval)
            setIsHolding(false)
            setConfirmProgress(0)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mouseup", handleMouseUp)
    }

    const executeAbort = async () => {
        if (!activeMissionId) return

        try {
            // Send abort command via API
            const response = await fetch("/api/mission/abort", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: activeMissionId }),
            })

            if (!response.ok) {
                throw new Error("Failed to send abort command")
            }

            // Update mission status
            abortMission(activeMissionId)

            toast.success("Mission aborted - Drone returning to safe mode", {
                description: "Emergency stop command sent successfully",
            })

            setShowDialog(false)
            setConfirmProgress(0)
        } catch (error) {
            console.error("Abort failed:", error)
            toast.error("Failed to abort mission", {
                description: "Please try manual control or contact support",
            })
        }
    }

    // Don't render if no active mission
    if (!activeMissionId) {
        return null
    }

    return (
        <>
            {/* Floating Emergency Button */}
            <Button
                variant="destructive"
                size="lg"
                className={`fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform ${className}`}
                onClick={handleAbortClick}
                aria-label="Emergency Abort Mission"
            >
                <AlertTriangle className="h-8 w-8 animate-pulse" />
            </Button>

            {/* Confirmation Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md border-destructive">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Emergency Mission Abort
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            This will immediately stop the current mission and command the drone to enter safe mode (Return to Home or Emergency Land based on battery level).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
                            <p className="text-sm font-semibold">⚠️ Safety Protocol:</p>
                            <ul className="text-xs space-y-1 ml-4 list-disc text-muted-foreground">
                                <li>Drone will stop all mission waypoints immediately</li>
                                <li>Return-to-Home will initiate if battery &gt; 25%</li>
                                <li>Emergency land at current location if battery &lt; 25%</li>
                                <li>This action cannot be undone</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-center">
                                Hold the button below for 1 second to confirm abort
                            </p>
                            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-destructive transition-all duration-100"
                                    style={{ width: `${confirmProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-2">
                        <Button
                            variant="destructive"
                            className="w-full h-12 text-base font-bold"
                            onMouseDown={handleMouseDown}
                            disabled={confirmProgress > 0 && confirmProgress < 100}
                        >
                            {confirmProgress === 0 ? (
                                "HOLD TO ABORT MISSION"
                            ) : confirmProgress < 100 ? (
                                `ABORTING... ${Math.floor(confirmProgress / 10)}/10`
                            ) : (
                                "ABORT COMPLETE"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setShowDialog(false)
                                setConfirmProgress(0)
                            }}
                            disabled={isHolding}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel - Continue Mission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
