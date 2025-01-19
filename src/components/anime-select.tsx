"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import Fuse from "fuse.js"
import { useDebounce } from "@/hooks/use-debounce"

interface Anime {
    id: string
    title: string
    malId: number
    titleJp: string | null
    imageUrl: string | null
}

interface AnimeSelectProps {
    value: Anime | null
    onSelect: (anime: Anime | null) => void
    placeholder?: string
    disabled?: boolean
    animes: Anime[]
}

const fuseOptions = {
    keys: ["title", "titleJp"],
    threshold: 0.4,
    distance: 200,
    minMatchCharLength: 2,
    ignoreLocation: true,
    shouldSort: true,
    sortFn: (a: { score: number }, b: { score: number }) => a.score - b.score
}

export function AnimeSelect({ value, onSelect, placeholder = "Search...", disabled, animes }: AnimeSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 150)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    const fuse = useMemo(() => new Fuse(animes, fuseOptions), [animes])

    const results = useMemo(() => {
        if (!debouncedSearch) return animes.slice(0, 10)
        return fuse.search(debouncedSearch, { limit: 10 }).map(result => result.item)
    }, [debouncedSearch, animes, fuse])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        setActiveIndex(0)
    }, [results])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setOpen(false)
            return
        }

        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setOpen(true)
                e.preventDefault()
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setActiveIndex(i => (i + 1) % results.length)
                break
            case "ArrowUp":
                e.preventDefault()
                setActiveIndex(i => (i - 1 + results.length) % results.length)
                break
            case "Enter":
                e.preventDefault()
                if (results[activeIndex]) {
                    onSelect(results[activeIndex])
                    setOpen(false)
                    setSearch("")
                }
                break
            case "Tab":
                setOpen(false)
                break
        }
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <Command
                className="relative w-full"
                shouldFilter={false}
                onKeyDown={handleKeyDown}
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Command.Input
                        ref={inputRef}
                        value={search}
                        onValueChange={setSearch}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="manga-input w-full pl-10"
                    />
                </div>

                {open && (
                    <div
                        className="fixed left-0 right-0 z-[9999] mt-2 overflow-hidden rounded-xl bg-black/90 p-2 backdrop-blur-xl"
                        style={{
                            position: 'fixed',
                            top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 8 : 0,
                            width: containerRef.current ? containerRef.current.offsetWidth : '100%',
                            left: containerRef.current ? containerRef.current.getBoundingClientRect().left : 0,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
                        }}
                    >
                        <Command.List className="max-h-[300px] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb:hover]:bg-white/20">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((anime, index) => (
                                        <Command.Item
                                            key={anime.id}
                                            value={anime.title}
                                            onSelect={() => {
                                                onSelect(anime)
                                                setOpen(false)
                                                setSearch("")
                                            }}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 ${index === activeIndex ? "bg-white/10" : ""
                                                }`}
                                        >
                                            {anime.imageUrl && (
                                                <img
                                                    src={anime.imageUrl}
                                                    alt={anime.title}
                                                    className="h-8 w-6 rounded object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div>
                                                <div>{anime.title}</div>
                                                {anime.titleJp && (
                                                    <div className="text-xs text-white/40">{anime.titleJp}</div>
                                                )}
                                            </div>
                                        </Command.Item>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-6 text-center text-sm text-white/40">
                                    No results found.
                                </div>
                            )}
                        </Command.List>
                    </div>
                )}
            </Command>
        </div>
    )
}
