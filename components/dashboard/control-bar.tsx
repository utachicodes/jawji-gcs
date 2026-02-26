"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { useMissionStore } from "@/lib/mission-store"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ControlBar({ className }: { className?: string }) {
  const [abortOpen, setAbortOpen] = useState(false)
  const [takeoffOpen, setTakeoffOpen] = useState(false)
  const [landOpen, setLandOpen] = useState(false)
  const activeMissionId = useMissionStore((s) => s.activeMissionId)
  const abortMission = useMissionStore((s) => s.abortMission)

  const handleTakeoffConfirm = () => {
    toast.success("TAKEOFF command issued")
    setTakeoffOpen(false)
  }

  const handleLandConfirm = () => {
    toast.warning("LAND command issued")
    setLandOpen(false)
  }

  const handleAbortConfirm = () => {
    if (activeMissionId) {
      abortMission(activeMissionId)
      toast.error("Mission aborted — drone entering safe mode")
    } else {
      toast.error("No active mission to abort")
    }
    setAbortOpen(false)
  }

  return (
    <>
      <div className={`grid grid-cols-12 gap-3 h-full ${className ?? ""}`}>

        {/* Primary flight actions — 4 equal buttons */}
        <div className="col-span-12 grid grid-cols-2 grid-rows-2 md:grid-cols-4 md:grid-rows-1 gap-3 h-full">
          <Button
            variant="ghost"
            onClick={() => setTakeoffOpen(true)}
            className="h-full min-h-0 rounded-md px-4 flex flex-col items-start justify-center border-2 border-emerald-500/70 bg-emerald-500/20 hover:bg-emerald-500/30 text-foreground active:translate-y-px"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">TAKEOFF</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tight">AUTO ASCEND</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => toast.warning("RTH command issued")}
            className="h-full min-h-0 rounded-md px-4 flex flex-col items-start justify-center border-2 border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 text-foreground active:translate-y-px"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">RTH</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tight">RETURN HOME</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setLandOpen(true)}
            className="h-full min-h-0 rounded-md px-4 flex flex-col items-start justify-center border-2 border-border/80 bg-muted/10 hover:bg-muted/20 text-foreground active:translate-y-px"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">LAND</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tight">CONTROLLED DESCENT</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setAbortOpen(true)}
            className="h-full min-h-0 rounded-md px-4 flex flex-col items-start justify-center border-2 border-red-500/80 bg-red-600/15 hover:bg-red-600/25 text-foreground active:translate-y-px"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-red-700 dark:text-red-200">ABORT</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tight">
              {activeMissionId ? "MISSION ACTIVE" : "EMERGENCY STOP"}
            </span>
          </Button>
        </div>
      </div>

      {/* Takeoff confirmation dialog */}
      <Dialog open={takeoffOpen} onOpenChange={setTakeoffOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Takeoff</DialogTitle>
            <DialogDescription>
              This will command the aircraft to arm and begin an automatic takeoff.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
            <Button className="w-full h-12 text-base font-bold" onClick={handleTakeoffConfirm}>
              CONFIRM TAKEOFF
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setTakeoffOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Land confirmation dialog */}
      <Dialog open={landOpen} onOpenChange={setLandOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Landing</DialogTitle>
            <DialogDescription>
              This will initiate a controlled landing sequence.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
            <Button className="w-full h-12 text-base font-bold" onClick={handleLandConfirm}>
              CONFIRM LAND
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLandOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Abort confirmation dialog */}
      <Dialog open={abortOpen} onOpenChange={setAbortOpen}>
        <DialogContent className="sm:max-w-md border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Abort
            </DialogTitle>
            <DialogDescription>
              This will immediately stop the current mission and command the
              drone to enter safe mode (Return to Home or Emergency Land based
              on battery level).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
            <Button
              variant="destructive"
              className="w-full h-12 text-base font-bold"
              onClick={handleAbortConfirm}
            >
              CONFIRM ABORT
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAbortOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel — Continue Mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
