"use client"

import { useEffect, useRef, useState } from "react"
import ReactPlayer from "react-player"
import { motion } from "framer-motion"

interface VideoPlayerProps {
    url: string
    className?: string
}

// Cache for video URLs
const videoCache = new Map<string, { blob: Blob, url: string }>()

export function VideoPlayer({ url, className }: VideoPlayerProps) {
    const [isClient, setIsClient] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [cachedUrl, setCachedUrl] = useState<string>()
    const playerRef = useRef<ReactPlayer>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        async function cacheVideo() {
            // Check if video is already cached
            if (videoCache.has(url)) {
                setCachedUrl(videoCache.get(url)!.url)
                setIsLoading(false)
                return
            }

            try {
                // Fetch and cache the video
                const response = await fetch(url)
                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)

                // Store in cache
                videoCache.set(url, { blob, url: blobUrl })
                setCachedUrl(blobUrl)
            } catch (error) {
                console.error("Error caching video:", error)
                // Fallback to original URL if caching fails
                setCachedUrl(url)
            } finally {
                setIsLoading(false)
            }
        }

        cacheVideo()

        // Cleanup function
        return () => {
            // Only revoke if it's a blob URL we created
            if (cachedUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(cachedUrl)
            }
        }
    }, [url])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/5 via-black to-purple-500/5 shadow-2xl shadow-purple-500/10 ring-1 ring-white/10 ${className ?? ""}`}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {isClient && (
                <div className="relative h-full w-full">
                    <ReactPlayer
                        ref={playerRef}
                        url={cachedUrl || url}
                        width="100%"
                        height="100%"
                        controls
                        playing={false}
                        onReady={() => setIsLoading(false)}
                        onError={(e) => {
                            console.error("Video player error:", e)
                            setHasError(true)
                            setIsLoading(false)
                        }}
                        config={{
                            file: {
                                attributes: {
                                    crossOrigin: "anonymous",
                                    style: {
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }
                                },
                            },
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                        }}
                    />
                </div>
            )}

            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                >
                    <div className="relative h-8 w-8">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                </motion.div>
            )}

            {hasError && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                >
                    <div className="rounded-xl bg-black/40 px-4 py-2 text-sm text-white/60 backdrop-blur-sm">
                        Failed to load video
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
