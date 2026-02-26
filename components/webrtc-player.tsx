"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"


const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any

interface WebRTCPlayerProps {
    url?: string
    streamUrl?: string
    droneId?: string
    className?: string
    autoPlay?: boolean
    muted?: boolean
    poster?: string
    fallbackToDeviceCamera?: boolean
    connectionState?: "connected" | "warning" | "disconnected"
}

export function WebRTCPlayer({
    url,
    streamUrl,
    droneId,
    className,
    autoPlay = true,
    muted = true,
    poster,
    fallbackToDeviceCamera = true,
    connectionState = "connected",
}: WebRTCPlayerProps) {
    const [mounted, setMounted] = useState(false)
    const effectiveUrl = url || streamUrl || ""
    const localVideoRef = useRef<HTMLVideoElement | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const [cameraState, setCameraState] = useState<"idle" | "ready" | "blocked" | "unavailable">("idle")

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        if (effectiveUrl) return
        if (!fallbackToDeviceCamera) return
        if (connectionState === "disconnected") return
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraState("unavailable")
            return
        }

        let cancelled = false

        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                    audio: false,
                })
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }
                mediaStreamRef.current = stream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream
                }
                setCameraState("ready")
            } catch {
                setCameraState("blocked")
            }
        }

        start()

        return () => {
            cancelled = true
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop())
                mediaStreamRef.current = null
            }
        }
    }, [mounted, effectiveUrl, fallbackToDeviceCamera, connectionState])

    if (!mounted) {
        return <div className={`bg-black ${className}`} />
    }

    if (!effectiveUrl) {
        if (connectionState === "disconnected") {
            return (
                <div className={`bg-black ${className} flex items-center justify-center`}>
                    <div className="px-3 py-2 border border-red-500/60 bg-red-600/20 text-red-200 text-[11px] font-mono font-bold tracking-widest">
                        LINK LOST
                    </div>
                </div>
            )
        }

        if (!fallbackToDeviceCamera) {
            return (
                <div className={`bg-black flex items-center justify-center text-muted-foreground text-xs ${className}`}>
                    NO VIDEO SOURCE
                </div>
            )
        }

        return (
            <div className={`relative bg-black ${className} overflow-hidden`}>
                <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                />
                {cameraState !== "ready" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`px-3 py-2 border text-[11px] font-mono font-bold tracking-widest ${
                            cameraState === "blocked"
                                ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                                : "border-border/60 bg-background/10 text-muted-foreground"
                        }`}>
                            {cameraState === "blocked" ? "CAMERA PERMISSION REQUIRED" : "ACQUIRING CAMERA"}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const isYouTube = effectiveUrl.includes("youtube.com") || effectiveUrl.includes("youtu.be")

    // Check if it's a YouTube URL
    // const isYouTube = url.includes("youtube.com") || url.includes("youtu.be") - Removed duplicate

    if (isYouTube) {
        return (
            <div className={`relative bg-black ${className} overflow-hidden pointer-events-auto group`}>
                <ReactPlayer
                    url={effectiveUrl}
                    width="100%"
                    height="100%"
                    playing={autoPlay}
                    muted={muted}
                    loop={true}
                    controls={false}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 0, controls: 0, modestbranding: 1 }
                        }
                    } as any}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                />
            </div>
        )
    }

    // Fallback for standard video files
    return (
        <div className={`relative bg-black ${className} overflow-hidden group`}>
            <video
                src={effectiveUrl}
                className="w-full h-full object-cover"
                autoPlay={autoPlay}
                muted={muted}
                playsInline
                loop
                poster={poster}
            />
        </div>
    )
}
