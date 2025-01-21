"use client"

import { useEffect, useRef, useState } from "react"
import ReactPlayer from "react-player"
import { motion } from "framer-motion"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    const [isPlaying, setIsPlaying] = useState(false)
    const [showOverlay, setShowOverlay] = useState(true)
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
    }, [url])

    // Separate cleanup effect
    useEffect(() => {
        return () => {
            // Only revoke if it's a blob URL we created
            if (cachedUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(cachedUrl)
            }
        }
    }, [cachedUrl])

    const handlePlay = () => {
        setIsPlaying(true)
        setShowOverlay(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "group relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/5 via-black to-purple-500/5 shadow-2xl shadow-purple-500/10 ring-1 ring-white/10",
                className
            )}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {isClient && (
                <div className="relative h-full w-full">
                    <ReactPlayer
                        ref={playerRef}
                        url={cachedUrl || url}
                        width="100%"
                        height="100%"
                        controls={isPlaying}
                        playing={isPlaying}
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

            {showOverlay && !isLoading && !hasError && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <div className="max-w-md space-y-6 text-center">
                        <h2 className="text-2xl font-bold text-white">Guess the Anime!</h2>
                        <p className="text-sm text-white/80">
                            Watch the scene and try to guess which anime it&apos;s from. The more accurate and faster you guess, the more points you&apos;ll earn!
                        </p>
                        <Button
                            onClick={handlePlay}
                            size="lg"
                            className="group relative overflow-hidden rounded-full bg-primary px-8 py-2 transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-[0_0_20px_2px_rgba(168,85,247,0.4)]"
                        >
                            <div className="relative flex items-center gap-2">
                                <Play className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                                <span className="transition-transform duration-300 group-hover:translate-x-1">Start Watching</span>
                            </div>
                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/0 via-white/25 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </Button>
                    </div>
                </motion.div>
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
