"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function MapGeofence({ value, onChange }: { value?: string; onChange: (wkt: string) => void }) {
  const [local, setLocal] = useState<string>(value || "")

  return (
    <div className="space-y-3">
      <Card className="h-64 w-full flex items-center justify-center border-dashed">
        <div className="text-center text-sm text-muted-foreground">
          Map placeholder
          <div className="text-xs">(Integrate map and drawing tools here)</div>
        </div>
      </Card>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 h-10 rounded-md border bg-transparent px-3 text-sm outline-none"
          placeholder="Polygon WKT or coordinates"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
        <Button type="button" onClick={() => onChange(local)}>
          Use selection
        </Button>
      </div>
    </div>
  )
}
