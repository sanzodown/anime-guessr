"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { SceneForm } from "@/components/scene-form"
import { deleteScene } from "@/app/actions"
import { Trash2, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Scene {
    id: string
    animeId: string
    videoUrl: string
    releaseDate: string
    isActive: boolean
    anime: {
        id: string
        malId: number
        title: string
        titleJp: string | null
        titleEn: string | null
        imageUrl: string | null
    }
}

interface AdminScenesProps {
    initialScenes: Scene[]
    onRefresh: () => Promise<void>
}

type TimeFilter = "past" | "today" | "future" | "all"

export function AdminScenes({ initialScenes, onRefresh }: AdminScenesProps) {
    const [scenes, setScenes] = useState<Scene[]>(initialScenes)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string>()
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")

    // Log scenes for debugging
    console.log("Initial scenes:", initialScenes)
    console.log("Current scenes:", scenes)

    const today = useMemo(() => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        return date
    }, [])

    const filteredScenes = useMemo(() => {
        return scenes.filter(scene => {
            const releaseDate = new Date(scene.releaseDate)
            releaseDate.setHours(0, 0, 0, 0)

            switch (timeFilter) {
                case "past":
                    return releaseDate < today
                case "today":
                    return releaseDate.getTime() === today.getTime()
                case "future":
                    return releaseDate > today
                default:
                    return true
            }
        }).sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    }, [scenes, timeFilter, today])

    async function handleDeleteScene(formData: FormData) {
        if (!confirm("Are you sure you want to delete this scene?")) return
        setIsDeleting(true)
        setError(undefined)

        try {
            const sceneId = formData.get("sceneId") as string
            const scene = scenes.find(s => s.id === sceneId)
            if (!scene) throw new Error("Scene not found")

            // Delete the video file first
            const videoPath = scene.videoUrl.split("/").pop()
            if (videoPath) {
                const deleteRes = await fetch(`/api/upload?file=${videoPath}`, {
                    method: "DELETE",
                })
                if (!deleteRes.ok) {
                    console.error("Failed to delete video file")
                }
            }

            // Then delete the scene from the database
            const result = await deleteScene(formData)
            if ("error" in result) {
                setError(result.error)
                return
            }

            await onRefresh()
        } catch (e) {
            console.error("Error deleting scene:", e)
            setError("Failed to delete scene")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8">
            <SceneForm onSuccess={onRefresh} />

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                >
                    {error}
                </motion.p>
            )}

            {isDeleting && (
                <div className="text-center text-white/60">
                    Deleting...
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Scenes ({filteredScenes.length})</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTimeFilter("all")}
                            className={`rounded px-3 py-1 text-sm ${timeFilter === "all" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setTimeFilter("past")}
                            className={`rounded px-3 py-1 text-sm ${timeFilter === "past" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
                        >
                            Past
                        </button>
                        <button
                            onClick={() => setTimeFilter("today")}
                            className={`rounded px-3 py-1 text-sm ${timeFilter === "today" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setTimeFilter("future")}
                            className={`rounded px-3 py-1 text-sm ${timeFilter === "future" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
                        >
                            Future
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {filteredScenes.map(scene => {
                        const releaseDate = new Date(scene.releaseDate)
                        releaseDate.setHours(0, 0, 0, 0)
                        const isPast = releaseDate < today
                        const isToday = releaseDate.getTime() === today.getTime()
                        const isFuture = releaseDate > today

                        return (
                            <div
                                key={scene.id}
                                className={`relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 ${isToday ? "ring-1 ring-purple-500" : ""
                                    }`}
                            >
                                <div className="mb-4 flex items-center gap-4">
                                    {scene.anime.imageUrl && (
                                        <Image
                                            src={scene.anime.imageUrl}
                                            alt={scene.anime.title}
                                            width={48}
                                            height={72}
                                            className="rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <Link
                                            href={`/admin/scenes/${scene.id}`}
                                            className="text-sm font-medium hover:text-purple-400"
                                        >
                                            {scene.anime.title}
                                        </Link>
                                        {scene.anime.titleEn && scene.anime.titleEn !== scene.anime.title && (
                                            <div className="text-sm text-white/60">{scene.anime.titleEn}</div>
                                        )}
                                        <div className="mt-2 flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4" />
                                            <span className={`${isToday ? "text-purple-400" :
                                                isPast ? "text-white/40" :
                                                    "text-white/60"
                                                }`}>
                                                {new Date(scene.releaseDate).toLocaleDateString()}
                                                {isToday && " (Today)"}
                                            </span>
                                            {scene.isActive && (
                                                <span className="ml-2 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <form action={handleDeleteScene}>
                                        <input type="hidden" name="sceneId" value={scene.id} />
                                        <button
                                            type="submit"
                                            className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/60"
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredScenes.length === 0 && (
                    <div className="text-center text-white/40">
                        No scenes found for the selected filter
                    </div>
                )}
            </div>
        </div>
    )
}
