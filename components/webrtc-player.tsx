"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"

interface WebRTCPlayerProps {
    url: string
    className?: string
    autoPlay?: boolean
    muted?: boolean
    poster?: string
}

export function WebRTCPlayer({
    url,
    className,
    autoPlay = true,
    muted = true,
    poster
}: WebRTCPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")

    // In a real implementation, this would connect to a signaling server
    // and establish an RTCPeerConnection.
    // For this simulation, we'll verify the URL and pass it through, 
    // mimicking the connection state lifecycle.

    useEffect(() => {
        setStatus("connecting")
        // Simulate connection delay
        const timer = setTimeout(() => {
            setStatus("connected")
        }, 1500)

        return () => clearTimeout(timer)
    }, [url])

    return (
        <div className={`relative bg-black ${className}`}>
            {/* Placeholder for actual WebRTC Stream implementation */}
            {/* In production, srcObject would be set from the RTCPeerConnection */}

            <video
                ref={videoRef}
                src={url} // Fallback for simulation
                className="w-full h-full object-cover"
                autoPlay={autoPlay}
                muted={muted}
                playsInline
                loop // Loop for simulation
                poster={poster}
            />

            {status === "connecting" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-xs font-mono text-white/80">ESTABLISHING WEBRTC LINK...</span>
                    </div>
                </div>
            )}

            {status === "disconnected" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs font-bold">SIGNAL LOST</span>
                    </div>
                </div>
            )}

            <div className="absolute top-2 left-2 z-20 flex gap-2">
                <div className="bg-black/40 text-white/70 border border-white/10 px-2 py-1 rounded text-[10px] font-mono backdrop-blur-sm">
                    WEBRTC
                </div>
            </div>
        </div>
    )
}
