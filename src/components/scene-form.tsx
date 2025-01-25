"use client"

import { useEffect, useState } from "react"
import { createScene } from "@/app/actions"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AnimeSelect } from "./anime-select"
import { Upload } from "lucide-react"
import Image from "next/image"
import { formatBytes } from "@/lib/utils"
import { uploadVideo } from "@/lib/supabase-storage"

interface Anime {
    id: string
    title: string
    malId: number
    titleJp: string | null
    titleEn: string | null
    imageUrl: string | null
}

interface SceneFormProps {
    onSuccess: () => void
}

interface UploadState {
    progress: number
    speed: number
    timeRemaining?: number
}

export function SceneForm({ onSuccess }: SceneFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string>()
    const [success, setSuccess] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
    const [animes, setAnimes] = useState<Anime[]>([])
    const [isLoadingAnimes, setIsLoadingAnimes] = useState(true)
    const [uploadState, setUploadState] = useState<UploadState>({
        progress: 0,
        speed: 0
    })
    const [isUploading, setIsUploading] = useState(false)
    const [videoUrl, setVideoUrl] = useState<string>("")

    useEffect(() => {
        // Fetch anime list
        setIsLoadingAnimes(true)
        fetch("/api/animes?limit=1000")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch animes")
                return res.json()
            })
            .then(data => {
                if (data && Array.isArray(data.animes)) {
                    setAnimes(data.animes)
                } else {
                    console.error("Invalid anime data format:", data)
                    setError("Failed to load anime list")
                }
            })
            .catch(error => {
                console.error("Error fetching animes:", error)
                setError("Failed to load anime list")
            })
            .finally(() => {
                setIsLoadingAnimes(false)
            })
    }, [])

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const maxSize = 100 * 1024 * 1024 // 100MB in bytes
        if (file.size > maxSize) {
            setError("File size must be less than 100MB")
            return
        }

        if (!file.type.startsWith("video/")) {
            setError("Please upload a valid video file")
            return
        }

        setError(undefined)
        setIsUploading(true)
        setUploadState({ progress: 0, speed: 0 })

        try {
            const url = await uploadVideo(file)
            setVideoUrl(url)
            setUploadState(prev => ({ ...prev, progress: 100 }))
        } catch (error) {
            console.error("Upload error:", error)
            setError(error instanceof Error ? error.message : "Failed to upload video")
            setUploadState({ progress: 0, speed: 0 })
        } finally {
            setIsUploading(false)
        }
    }

    async function clientAction(formData: FormData) {
        setError(undefined)
        setSuccess(false)
        setIsPending(true)

        try {
            if (!selectedAnime) {
                setError("Please select an anime")
                return
            }

            if (!videoUrl && !formData.get("videoUrl")) {
                setError("Please provide a video URL or upload a video")
                return
            }

            formData.set("animeId", selectedAnime.id)
            if (videoUrl) {
                formData.set("videoUrl", videoUrl)
            }

            const result = await createScene(formData)

            if ("error" in result) {
                setError(result.error)
                return
            }

            setSuccess(true)
            router.refresh()
            setSelectedAnime(null)
            setVideoUrl("")
            onSuccess()

            // Reset form
            const form = document.querySelector("form") as HTMLFormElement
            form?.reset()
        } catch (e) {
            console.error("Error creating scene:", e)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form action={clientAction} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">
                    Select Anime
                </label>
                <div className="relative">
                    {selectedAnime ? (
                        <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                            {selectedAnime.imageUrl && (
                                <Image
                                    src={selectedAnime.imageUrl}
                                    alt={selectedAnime.title}
                                    width={48}
                                    height={72}
                                    className="rounded"
                                />
                            )}
                            <div>
                                <div className="text-sm text-white/80">{selectedAnime.titleEn || selectedAnime.title}</div>
                                {selectedAnime.title !== (selectedAnime.titleEn || selectedAnime.title) && (
                                    <div className="text-sm text-white/60">{selectedAnime.title}</div>
                                )}
                                {selectedAnime.titleJp && selectedAnime.titleJp !== selectedAnime.title && (
                                    <div className="text-xs text-white/40">{selectedAnime.titleJp}</div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAnime(null)}
                                className="ml-auto text-sm text-white/40 hover:text-white/60"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            {isLoadingAnimes ? (
                                <div className="manga-input flex h-11 w-full items-center justify-center">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
                                </div>
                            ) : (
                                <AnimeSelect
                                    onSelect={setSelectedAnime}
                                    placeholder="Search for an anime..."
                                    animes={animes}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">
                    Video
                </label>
                <div className="relative">
                    {videoUrl ? (
                        <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                            <div className="text-sm text-white/80">Video uploaded successfully</div>
                            <button
                                type="button"
                                onClick={() => setVideoUrl("")}
                                className="ml-auto text-sm text-white/40 hover:text-white/60"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="video-upload"
                            />
                            <label
                                htmlFor="video-upload"
                                className="manga-input flex cursor-pointer items-center gap-2 hover:bg-white/5"
                            >
                                <Upload className="h-4 w-4" />
                                <span>Upload video</span>
                            </label>
                        </div>
                    )}
                </div>
                {isUploading && (
                    <div className="space-y-2">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full bg-purple-500 transition-all duration-300"
                                style={{ width: `${uploadState.progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/60">
                            <div>{Math.round(uploadState.progress)}%</div>
                            <div>{formatBytes(uploadState.speed)}/s</div>
                            {uploadState.timeRemaining && (
                                <div>
                                    {Math.round(uploadState.timeRemaining)}s remaining
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">
                    Release Date
                </label>
                <input
                    type="date"
                    name="releaseDate"
                    required
                    className="manga-input"
                    min={new Date().toISOString().split("T")[0]}
                />
                <div className="text-xs text-white/40">
                    The scene will be automatically activated at midnight on this date
                </div>
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                >
                    {error}
                </motion.p>
            )}

            {success && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-400"
                >
                    Scene created successfully!
                </motion.p>
            )}

            <button
                type="submit"
                disabled={isPending || isUploading}
                className="manga-button w-full disabled:opacity-50"
            >
                {isPending ? "Creating..." : "Create Scene"}
            </button>
        </form>
    )
}
