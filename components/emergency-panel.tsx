"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function EmergencyPanel() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [emergencyAction, setEmergencyAction] = useState<string>("")

  const handleEmergency = (action: string) => {
    setEmergencyAction(action)
    setShowConfirm(true)
  }

  const executeEmergency = () => {
    console.log("[JAWJI] Emergency action executed:", emergencyAction)
    // Execute emergency command
    setShowConfirm(false)
  }

  return (
    <>
      <Card className="fixed bottom-6 right-6 z-50 p-4 bg-card/95 backdrop-blur border-2 border-red-500/50">
        <div className="space-y-2">
          <div className="text-xs font-mono text-red-500 font-bold mb-3">EMERGENCY CONTROLS</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="h-12 font-mono text-xs"
              onClick={() => handleEmergency("RTL")}
            >
              RTL
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-12 font-mono text-xs"
              onClick={() => handleEmergency("HOVER")}
            >
              HOVER
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-12 font-mono text-xs"
              onClick={() => handleEmergency("LAND")}
            >
              LAND
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-12 font-mono text-xs"
              onClick={() => handleEmergency("KILL")}
            >
              KILL
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">CONFIRM EMERGENCY ACTION</AlertDialogTitle>
            <AlertDialogDescription className="font-mono">
              You are about to execute: <span className="text-red-500 font-bold">{emergencyAction}</span>
              <br />
              This action cannot be undone. Confirm to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={executeEmergency} className="bg-red-500 hover:bg-red-600 font-mono">
              EXECUTE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
