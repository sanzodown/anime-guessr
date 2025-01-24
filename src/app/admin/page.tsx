"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logout } from "../actions"
import Link from "next/link"
import { AdminScenes } from "@/components/admin/scenes"
import { AdminAnimes } from "@/components/admin/animes"

interface Anime {
    id: string
    malId: number
    title: string
    titleJp: string | null
    titleEn: string | null
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

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/animes?limit=1000`)
            if (!response.ok) throw new Error("Failed to fetch animes")
            const data = await response.json()
            setAnimes(data.animes)

            const scenesResponse = await fetch("/api/scenes")
            if (!scenesResponse.ok) throw new Error("Failed to fetch scenes")
            const scenesData = await scenesResponse.json()
            setScenes(scenesData)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    async function handleLogout() {
        await logout()
        router.push("/admin/login")
        router.refresh()
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
                        <Link href="/" className="text-purple-500 hover:text-purple-400">
                            Back to Home
                        </Link>
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

                    {isLoading ? (
                        <div className="text-center text-white/60">
                            Loading...
                        </div>
                    ) : (
                        <>
                            {activeTab === "scenes" ? (
                                <AdminScenes
                                    initialScenes={scenes}
                                    onRefresh={fetchData}
                                />
                            ) : (
                                <AdminAnimes
                                    initialAnimes={animes}
                                    onRefresh={fetchData}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
