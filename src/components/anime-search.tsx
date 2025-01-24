import { useState } from "react"
import { Search } from "lucide-react"
import Image from "next/image"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface JikanAnime {
    mal_id: number
    title: string
    title_japanese: string
    title_english: string | null
    images: {
        jpg: {
            large_image_url: string
        }
    }
    synopsis: string
    type: string
}

interface AnimeSearchProps {
    onSuccess?: () => void
}

export function AnimeSearch({ onSuccess }: AnimeSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<JikanAnime[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>()

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!query.trim()) return

        setIsLoading(true)
        setError(undefined)

        try {
            const response = await fetch(`/api/jikan/search?q=${encodeURIComponent(query)}`)
            if (!response.ok) throw new Error("Failed to search anime")
            const data = await response.json()
            setResults(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to search anime")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAddAnime(anime: JikanAnime) {
        try {
            const response = await fetch("/api/animes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    malId: anime.mal_id,
                    title: anime.title,
                    titleJp: anime.title_japanese,
                    titleEn: anime.title_english,
                    imageUrl: anime.images.jpg.large_image_url,
                    synopsis: anime.synopsis,
                }),
            })

            if (!response.ok) throw new Error("Failed to add anime")

            setResults([])
            setQuery("")
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add anime")
        }
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Search anime..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {isLoading ? (
                <p className="text-center text-white/60">Searching...</p>
            ) : (
                <div className="grid gap-4">
                    {results.map((anime) => (
                        <div
                            key={anime.mal_id}
                            className="anime-card flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-4">
                                <Image
                                    src={anime.images.jpg.large_image_url}
                                    alt={anime.title}
                                    width={48}
                                    height={72}
                                    className="rounded"
                                />
                                <div>
                                    <div className="font-medium">
                                        {anime.title_english || anime.title}
                                    </div>
                                    {anime.title_english && (
                                        <div className="text-sm text-white/60">
                                            {anime.title}
                                        </div>
                                    )}
                                    {anime.title_japanese && (
                                        <div className="text-sm text-white/60">
                                            {anime.title_japanese}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={() => handleAddAnime(anime)}
                                variant="secondary"
                                size="sm"
                            >
                                Add
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
