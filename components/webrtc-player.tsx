"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import ReactPlayer to avoid SSR issues
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

    // Check if it's a YouTube URL
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be")

    if (isYouTube) {
        return (
            <div className={`relative bg-black ${className} overflow-hidden pointer-events-auto`}>
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
                <div className="absolute top-2 left-2 z-20 flex gap-2 pointer-events-none">
                    <div className="bg-red-600 text-white border border-white/10 px-2 py-1 rounded text-[10px] font-bold tracking-wider backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <span>LIVE</span>
                    </div>
                </div>
            </div>
        )
    }

    // Fallback for standard video files
    return (
        <div className={`relative bg-black ${className}`}>
            <video
                src={url}
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
