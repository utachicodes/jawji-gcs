import { NextRequest, NextResponse } from "next/server"
import { abortMission } from "@/lib/server/mqtt-client"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { missionId, droneId, batteryLevel } = body

        if (!missionId || !droneId) {
            return NextResponse.json(
                { error: "Missing missionId or droneId" },
                { status: 400 }
            )
        }

        // Send abort command via MQTT
        await abortMission(droneId, batteryLevel)

        console.log(`[API] Mission abort initiated for mission ${missionId}, drone ${droneId}`)

        return NextResponse.json({
            success: true,
            message: "Abort command sent successfully",
            safeMode: batteryLevel && batteryLevel < 25 ? "EMERGENCY_LAND" : "RTH"
        })
    } catch (error) {
        console.error("[API] Abort mission error:", error)
        return NextResponse.json(
            { error: "Failed to abort mission", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
