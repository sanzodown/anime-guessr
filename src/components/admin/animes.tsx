"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { deleteAnime } from "@/app/actions"
import { Trash2, Pencil } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { AnimeSearch } from "@/components/anime-search"

interface Anime {
    id: string
    malId: number
    title: string
    titleJp: string | null
    titleEn: string | null
    imageUrl: string | null
    synopsis: string | null
}

interface AdminAnimesProps {
    initialAnimes: Anime[]
    onRefresh: () => Promise<void>
}

const ITEMS_PER_PAGE = 20

export function AdminAnimes({ initialAnimes, onRefresh }: AdminAnimesProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string>()
    const [searchQuery, setSearchQuery] = useState("")
    const [editingAnime, setEditingAnime] = useState<Anime | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const filteredAnimes = useMemo(() => {
        if (!searchQuery.trim()) {
            return initialAnimes
        }

        const query = searchQuery.toLowerCase()
        return initialAnimes.filter(anime => {
            return (
                anime.title.toLowerCase().includes(query) ||
                (anime.titleEn?.toLowerCase().includes(query)) ||
                (anime.titleJp?.toLowerCase().includes(query))
            )
        })
    }, [searchQuery, initialAnimes])

    const totalPages = Math.ceil(filteredAnimes.length / ITEMS_PER_PAGE)
    const paginatedAnimes = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredAnimes.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredAnimes, currentPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

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

            await onRefresh()
        } catch (e) {
            console.error("Error deleting anime:", e)
            setError("Failed to delete anime")
        } finally {
            setIsDeleting(false)
        }
    }

    async function handleSaveAnime(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingAnime) return

        setIsEditing(true)
        setError(undefined)

        const formData = new FormData(e.currentTarget)
        const title = formData.get("title") as string
        const titleEn = formData.get("titleEn") as string
        const titleJp = formData.get("titleJp") as string

        try {
            const res = await fetch(`/api/animes`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingAnime.id,
                    title,
                    titleEn: titleEn || null,
                    titleJp: titleJp || null
                }),
            })

            if (!res.ok) {
                throw new Error("Failed to update anime")
            }

            await onRefresh()
            setEditingAnime(null)
        } catch (e) {
            console.error("Error updating anime:", e)
            setError("Failed to update anime")
        } finally {
            setIsEditing(false)
        }
    }

    return (
        <div className="space-y-8">
            <AnimeSearch onSuccess={onRefresh} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Animes</h2>
                    <div className="text-sm text-white/60">
                        {filteredAnimes.length} animes found
                    </div>
                </div>
                <Input
                    type="search"
                    placeholder="Search animes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />

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

                <div className="grid gap-4 sm:grid-cols-2">
                    {paginatedAnimes.map(anime => (
                        <div
                            key={anime.id}
                            className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                        >
                            {editingAnime?.id === anime.id ? (
                                <form onSubmit={handleSaveAnime} className="space-y-4">
                                    <div className="space-y-2">
                                        <Input
                                            name="title"
                                            defaultValue={anime.title}
                                            placeholder="Title"
                                            required
                                        />
                                        <Input
                                            name="titleEn"
                                            defaultValue={anime.titleEn || ""}
                                            placeholder="English Title"
                                        />
                                        <Input
                                            name="titleJp"
                                            defaultValue={anime.titleJp || ""}
                                            placeholder="Japanese Title"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="rounded bg-purple-500 px-3 py-1 text-sm hover:bg-purple-600"
                                            disabled={isEditing}
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingAnime(null)}
                                            className="rounded px-3 py-1 text-sm text-white/60 hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="mb-4 flex items-center gap-4">
                                        {anime.imageUrl && (
                                            <Image
                                                src={anime.imageUrl}
                                                alt={anime.title}
                                                width={48}
                                                height={72}
                                                className="rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="font-medium">{anime.title}</div>
                                            {anime.titleEn && anime.titleEn !== anime.title && (
                                                <div className="text-sm text-white/60">{anime.titleEn}</div>
                                            )}
                                            {anime.titleJp && anime.titleJp !== anime.title && (
                                                <div className="text-xs text-white/40">{anime.titleJp}</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingAnime(anime)}
                                                className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/60"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <form action={handleDeleteAnime}>
                                                <input type="hidden" name="id" value={anime.id} />
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
                                    {anime.synopsis && (
                                        <p className="line-clamp-3 text-sm text-white/60">
                                            {anime.synopsis}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="manga-button disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <div className="text-sm text-white/60">
                            Page {currentPage} of {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="manga-button disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
