"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Activity } from "lucide-react"

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
}

export function TelemetryChart({
    title,
    value,
    unit,
    color,
    maxDataPoints = 30
}: TelemetryChartProps) {
    const [history, setHistory] = useState<TelemetryDataPoint[]>([])

    useEffect(() => {
        // Add new data point
        setHistory(prev => {
            const newPoint: TelemetryDataPoint = {
                timestamp: Date.now(),
                value: value
            }
            const updated = [...prev, newPoint]
            // Keep only last N points
            return updated.slice(-maxDataPoints)
        })
    }, [value, maxDataPoints])

    // Calculate min/max for scaling
    const values = history.map(d => d.value)
    const minValue = Math.min(...values, value)
    const maxValue = Math.max(...values, value)
    const range = maxValue - minValue || 1

    // Generate SVG path
    const width = 200
    const height = 40
    const points = history.map((point, idx) => {
        const x = (idx / (maxDataPoints - 1)) * width
        const y = height - ((point.value - minValue) / range) * height
        return `${x},${y}`
    }).join(' ')

    return (
        <Card className="p-3">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{title}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                        {value.toFixed(1)}{unit}
                    </Badge>
                </div>

                {history.length > 1 && (
                    <div className="w-full h-10 relative">
                        <svg
                            width={width}
                            height={height}
                            className="w-full h-full"
                            preserveAspectRatio="none"
                        >
                            <polyline
                                points={points}
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <polyline
                                points={points}
                                fill={color}
                                fillOpacity="0.1"
                                stroke="none"
                            />
                        </svg>
                    </div>
                )}
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
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
                <LineChart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Telemetry History</span>
            </div>

            <TelemetryChart
                title="Altitude"
                value={altitude}
                unit="m"
                color="#3b82f6"
            />
            <TelemetryChart
                title="Speed"
                value={speed}
                unit="m/s"
                color="#10b981"
            />
            <TelemetryChart
                title="Battery"
                value={battery}
                unit="%"
                color="#f59e0b"
            />
            <TelemetryChart
                title="Vertical Speed"
                value={verticalSpeed}
                unit="m/s"
                color="#8b5cf6"
            />
        </div>
    )
}
