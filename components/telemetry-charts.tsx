"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Activity } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface TelemetryDataPoint {
    timestamp: number
    value: number
}

interface TelemetryChartProps {
    title: string
    value: number
    unit: string
    color: string
    maxDataPoints?: number
    domain?: [number | "auto", number | "auto"]
}

export function TelemetryChart({
    title,
    value,
    unit,
    color,
    maxDataPoints = 30,
    domain = ["auto", "auto"]
}: TelemetryChartProps) {
    const [history, setHistory] = useState<TelemetryDataPoint[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        setHistory(prev => {
            const newPoint: TelemetryDataPoint = {
                timestamp: Date.now(),
                value: value
            }
            const updated = [...prev, newPoint]
            return updated.slice(-maxDataPoints)
        })
    }, [value, maxDataPoints])

    if (!mounted) return <Card className="p-3 h-[120px] glass-panel" />

    // Custom color processing for the gradient
    // Ensure we use the hex color or a fallback, but for now we trust the input
    const gradientId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`

    return (
        <Card className="p-3 glass-panel tech-border">
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur-sm border-white/10">
                        {value.toFixed(1)}<span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
                    </Badge>
                </div>

                <div className="h-[60px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis hide dataKey="timestamp" />
                            <YAxis hide domain={domain} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(0,0,0,0.8)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "4px",
                                    fontSize: "12px"
                                }}
                                itemStyle={{ color: "#fff" }}
                                labelStyle={{ display: "none" }}
                                formatter={(val: number | undefined) => [val?.toFixed(2) ?? "0.00", title]}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    )
}

interface TelemetryChartsProps {
    altitude: number
    speed: number
    battery: number
    verticalSpeed: number
}

export function TelemetryCharts({ altitude, speed, battery, verticalSpeed }: TelemetryChartsProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1 px-1">
                <LineChart className="h-4 w-4 text-primary tech-glow" />
                <span className="text-sm font-bold tracking-wide">TELEMETRY HISTORY</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <TelemetryChart
                    title="Altitude"
                    value={altitude}
                    unit="m"
                    color="oklch(0.68 0.19 45)" // Primary Orange
                />
                <TelemetryChart
                    title="Ground Speed"
                    value={speed}
                    unit="m/s"
                    color="oklch(0.55 0.22 25)" // Constructive/Green-ish or just keep orange? Sticking to Primary for consistency or specific
                />
                <TelemetryChart
                    title="Battery Level"
                    value={battery}
                    unit="%"
                    color={battery < 20 ? "#ef4444" : "#f59e0b"} // Red or Amber
                    domain={[0, 100]}
                />
                <TelemetryChart
                    title="Vertical Speed"
                    value={verticalSpeed}
                    unit="m/s"
                    color="oklch(0.68 0.19 45)"
                />
            </div>
        </div>
    )
}
