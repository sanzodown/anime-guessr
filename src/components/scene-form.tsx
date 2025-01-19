"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createScene } from "@/app/actions"
import { AnimeSelect } from "./anime-select"

interface Anime {
    id: string
    title: string
    malId: number
    titleJp: string | null
    imageUrl: string | null
}

interface SceneFormProps {
    animes: Anime[]
}

export function SceneForm({ animes }: SceneFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string>()
    const [success, setSuccess] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)

    async function clientAction(formData: FormData) {
        setError(undefined)
        setSuccess(false)
        setIsPending(true)

        try {
            if (!selectedAnime) {
                setError("Please select an anime")
                return
            }

            formData.set("animeId", selectedAnime.id)

            const result = await createScene(formData)

            if ("error" in result) {
                setError(result.error)
                return
            }

            setSuccess(true)
            router.refresh()
            setSelectedAnime(null)

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
                                <img
                                    src={selectedAnime.imageUrl}
                                    alt={selectedAnime.title}
                                    className="h-8 w-6 rounded object-cover"
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
                        <AnimeSelect
                            value={selectedAnime}
                            onSelect={setSelectedAnime}
                            placeholder="Search for an anime..."
                            animes={animes}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="videoUrl" className="text-sm font-medium text-white/60">
                    Video URL
                </label>
                <input
                    type="url"
                    name="videoUrl"
                    id="videoUrl"
                    required
                    className="manga-input w-full"
                    placeholder="Enter MP4 or YouTube URL"
                    pattern="^(https?:\/\/.+\.mp4|https?:\/\/(www\.)?youtube\.com\/watch\?v=.+|https?:\/\/youtu\.be\/.+)$"
                />
                <p className="text-xs text-white/40">
                    Accepts direct MP4 links or YouTube URLs
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

            {success && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-400"
                >
                    Scene added successfully!
                </motion.p>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="manga-button w-full"
            >
                {isPending ? "Adding..." : "Add Scene"}
            </button>
        </form>
    )
}
