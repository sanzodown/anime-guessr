"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SceneForm } from "@/components/scene-form"
import { logout, deleteAnime, deleteScene } from "../actions"
import { Trash2 } from "lucide-react"

interface Anime {
    id: string
    malId: number
    title: string
    titleJp: string | null
    imageUrl: string | null
    synopsis: string | null
}

interface Scene {
    id: string
    animeId: string
    videoUrl: string
    startTime: number
    endTime: number
    releaseDate: string
    isActive: boolean
    anime: Anime
}

export default function AdminPage() {
    const router = useRouter()
    const [animes, setAnimes] = useState<Anime[]>([])
    const [scenes, setScenes] = useState<Scene[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"scenes" | "anime">("scenes")
    const [error, setError] = useState<string>()
    const [isDeleting, setIsDeleting] = useState(false)

    async function fetchData() {
        try {
            const [animesRes, scenesRes] = await Promise.all([
                fetch("/api/animes"),
                fetch("/api/scenes")
            ])

            if (!animesRes.ok || !scenesRes.ok) {
                throw new Error("Failed to fetch data")
            }

            const [animesData, scenesData] = await Promise.all([
                animesRes.json(),
                scenesRes.json()
            ])

            setAnimes(animesData)
            setScenes(scenesData)
            setIsLoading(false)
        } catch (error) {
            console.error("Error fetching data:", error)
            setError("Failed to load data")
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    async function handleLogout() {
        await logout()
        router.push("/admin/login")
        router.refresh()
    }

    async function handleDeleteAnime(formData: FormData) {
        if (!confirm("Are you sure you want to delete this anime?")) return
        setIsDeleting(true)
        setError(undefined)

        try {
            const result = await deleteAnime(formData)
            if ("error" in result) {
                setError(result.error)
                return
            }

            await fetchData() // Refresh both animes and scenes
        } catch (e) {
            console.error("Error deleting anime:", e)
            setError("Failed to delete anime")
        } finally {
            setIsDeleting(false)
        }
    }

    async function handleDeleteScene(formData: FormData) {
        if (!confirm("Are you sure you want to delete this scene?")) return
        setIsDeleting(true)
        setError(undefined)

        try {
            const result = await deleteScene(formData)
            if ("error" in result) {
                setError(result.error)
                return
            }

            await fetchData() // Refresh both animes and scenes
        } catch (e) {
            console.error("Error deleting scene:", e)
            setError("Failed to delete scene")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <main className="grid-bg relative min-h-screen overflow-hidden px-4 py-16">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="animate-glow text-3xl font-bold tracking-tight">
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="text-sm text-white/60 hover:text-white"
                        >
                            Logout
                        </button>
                        <a href="/" className="manga-button">
                            Back to Game
                        </a>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("scenes")}
                            className={`manga-button ${activeTab === "scenes" ? "bg-white/10" : ""}`}
                        >
                            Scenes
                        </button>
                        <button
                            onClick={() => setActiveTab("anime")}
                            className={`manga-button ${activeTab === "anime" ? "bg-white/10" : ""}`}
                        >
                            Anime
                        </button>
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

                    {isLoading || isDeleting ? (
                        <div className="text-center text-white/60">
                            {isLoading ? "Loading..." : "Deleting..."}
                        </div>
                    ) : (
                        <div>
                            {activeTab === "scenes" ? (
                                <div className="space-y-8">
                                    <SceneForm animes={animes} onSuccess={fetchData} />

                                    <div className="space-y-4">
                                        <h2 className="text-xl font-semibold">All Scenes</h2>
                                        <div className="grid gap-4">
                                            {scenes.map((scene) => (
                                                <div
                                                    key={scene.id}
                                                    className="anime-card flex items-center justify-between p-4"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {scene.anime.imageUrl && (
                                                            <img
                                                                src={scene.anime.imageUrl}
                                                                alt={scene.anime.title}
                                                                className="h-16 w-12 rounded object-cover"
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="font-medium">
                                                                {scene.anime.title}
                                                            </div>
                                                            <div className="text-sm text-white/60">
                                                                Release: {new Date(scene.releaseDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {scene.isActive && (
                                                            <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-500">
                                                                Active
                                                            </span>
                                                        )}
                                                        <form action={handleDeleteScene}>
                                                            <input type="hidden" name="sceneId" value={scene.id} />
                                                            <button
                                                                type="submit"
                                                                className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                                                title="Delete scene"
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold">All Anime</h2>
                                    <div className="grid gap-4">
                                        {animes.map((anime) => (
                                            <div
                                                key={anime.id}
                                                className="anime-card flex items-center justify-between p-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {anime.imageUrl && (
                                                        <img
                                                            src={anime.imageUrl}
                                                            alt={anime.title}
                                                            className="h-16 w-12 rounded object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">
                                                            {anime.title}
                                                        </div>
                                                        <div className="text-sm text-white/60">
                                                            MAL ID: {anime.malId}
                                                        </div>
                                                        {anime.titleJp && (
                                                            <div className="text-sm text-white/40">
                                                                {anime.titleJp}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <form action={handleDeleteAnime}>
                                                    <input type="hidden" name="animeId" value={anime.id} />
                                                    <button
                                                        type="submit"
                                                        className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                                        title="Delete anime"
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </form>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
