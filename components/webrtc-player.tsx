"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"


const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any

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
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={`bg-black ${className}`} />
    }

    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be")

    // Check if it's a YouTube URL
    // const isYouTube = url.includes("youtube.com") || url.includes("youtu.be") - Removed duplicate

    if (isYouTube) {
        return (
            <div className={`relative bg-black ${className} overflow-hidden pointer-events-auto group`}>
                <ReactPlayer
                    url={url}
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

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4">
                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
                    <div className="absolute inset-0 bg-black/10 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] pointer-events-none" />

                    {/* Live Status Badge */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <div className="bg-red-600/90 text-white border border-white/10 px-2 py-1 rounded text-[10px] font-bold tracking-widest backdrop-blur-sm shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span>LIVE FEED</span>
                        </div>
                        <div className="bg-black/60 text-white/80 border border-white/10 px-2 py-1 rounded text-[10px] font-mono backdrop-blur-sm">
                            CAM-01
                        </div>
                    </div>

                    {/* Rec Status */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 text-white/80 border border-white/10 px-2 py-1 rounded text-[10px] font-mono backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span>REC</span>
                        <span className="text-white/50 ml-1">00:14:23</span>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-4 left-4 z-20">
                        <div className="text-[10px] font-mono text-white/60 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                            1920x1080 • 60FPS • 4.2MBps
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Fallback for standard video files
    return (
        <div className={`relative bg-black ${className} overflow-hidden group`}>
            <video
                src={url}
                className="w-full h-full object-cover"
                autoPlay={autoPlay}
                muted={muted}
                playsInline
                loop
                poster={poster}
            />
            {/* HUD Overlay (Duplicate for consistency, ideally refactored) */}
            <div className="absolute inset-0 pointer-events-none p-4">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
                <div className="absolute inset-0 bg-black/10 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] pointer-events-none" />

                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <div className="bg-red-600/90 text-white border border-white/10 px-2 py-1 rounded text-[10px] font-bold tracking-widest backdrop-blur-sm shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span>LIVE FEED</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
