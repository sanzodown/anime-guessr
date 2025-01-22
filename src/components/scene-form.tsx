"use client"

import { useEffect, useState } from "react"
import { createScene } from "@/app/actions"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AnimeSelect } from "./anime-select"
import { Upload } from "lucide-react"
import Image from "next/image"

interface Anime {
    id: string
    title: string
    malId: number
    titleJp: string | null
    imageUrl: string | null
}

interface SceneFormProps {
    onSuccess: () => void
}

export function SceneForm({ onSuccess }: SceneFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string>()
    const [success, setSuccess] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
    const [animes, setAnimes] = useState<Anime[]>([])
    const [isLoadingAnimes, setIsLoadingAnimes] = useState(true)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
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
        setUploadProgress(0)

        const formData = new FormData()
        formData.append("file", file)

        try {
            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL}${process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT}`, {
                method: "POST",
                body: formData,
                mode: 'cors',
            })

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}))
                throw new Error(errorData.error || errorData.details || `Upload failed with status ${uploadResponse.status}`)
            }

            const data = await uploadResponse.json()
            setVideoUrl(data.url)
            setIsUploading(false)
            setUploadProgress(100)
        } catch (error) {
            console.error("Upload error:", error)

            // If the upload failed, try to get the latest video
            try {
                const latestResponse = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL}${process.env.NEXT_PUBLIC_LATEST_VIDEO_ENDPOINT}`, {
                    mode: 'cors'
                })
                if (latestResponse.ok) {
                    const data = await latestResponse.json()
                    setVideoUrl(data.url)
                    setIsUploading(false)
                    setUploadProgress(100)
                    return
                }
            } catch (latestError) {
                console.error("Failed to get latest video:", latestError)
            }

            setError(error instanceof Error ? error.message : "Failed to upload video")
            setIsUploading(false)
            setUploadProgress(0)
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
                                <div className="text-sm text-white/80">{selectedAnime.title}</div>
                                {selectedAnime.titleJp && (
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
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="video-upload"
                            disabled={isUploading || Boolean(videoUrl)}
                        />
                        <label
                            htmlFor="video-upload"
                            className={`manga-input flex h-32 cursor-pointer items-center justify-center gap-3 ${videoUrl ? 'bg-white/5 ring-1 ring-white/20' : ''}`}
                        >
                            {videoUrl ? (
                                <div className="text-center text-white/60">
                                    <p className="mb-1 text-sm">Video uploaded successfully!</p>
                                    <button
                                        type="button"
                                        onClick={() => setVideoUrl("")}
                                        className="text-xs text-white/40 hover:text-white/60"
                                    >
                                        Remove and upload another
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-white/60">
                                    <Upload className="mx-auto mb-2 h-6 w-6" />
                                    <span className="text-sm">
                                        {isUploading ? "Uploading..." : "Click to upload video"}
                                    </span>
                                </div>
                            )}
                        </label>
                        {isUploading && (
                            <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-lg bg-white/5">
                                <div
                                    className="h-full bg-purple-500 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                            or
                        </div>
                        <input
                            type="url"
                            name="videoUrl"
                            placeholder="Enter MP4 or YouTube URL"
                            pattern="^(https?:\/\/.+\.mp4|https?:\/\/(www\.)?youtube\.com\/watch\?v=.+|https?:\/\/youtu\.be\/.+)$"
                            className="manga-input w-full pl-10"
                            disabled={Boolean(videoUrl)}
                        />
                    </div>
                </div>
                <p className="text-xs text-white/40">
                    Accepts MP4 files, direct MP4 links, or YouTube URLs
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="startTime" className="text-sm font-medium text-white/60">
                        Start Time (seconds)
                    </label>
                    <input
                        type="number"
                        name="startTime"
                        id="startTime"
                        min={0}
                        step="any"
                        className="manga-input w-full"
                        placeholder="Optional"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="endTime" className="text-sm font-medium text-white/60">
                        End Time (seconds)
                    </label>
                    <input
                        type="number"
                        name="endTime"
                        id="endTime"
                        min={1}
                        step="any"
                        className="manga-input w-full"
                        placeholder="Optional"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="releaseDate" className="text-sm font-medium text-white/60">
                    Release Date
                </label>
                <input
                    type="datetime-local"
                    name="releaseDate"
                    id="releaseDate"
                    required
                    className="manga-input w-full"
                />
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

            <button
                type="submit"
                disabled={isPending || isLoadingAnimes || isUploading}
                className="manga-button w-full"
            >
                {isPending ? "Creating..." : "Create Scene"}
            </button>

            {success && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-400"
                >
                    Scene created successfully!
                </motion.p>
            )}
        </form>
    )
}
