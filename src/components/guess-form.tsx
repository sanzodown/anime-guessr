"use client"

import { useEffect, useState, useTransition } from "react"
import { submitGuess } from "@/app/actions"
import { useRouter } from "next/navigation"
import { SuccessScreen } from "./success-screen"
import { LoseScreen } from "./lose-screen"
import { motion } from "framer-motion"
import { AnimeSelect } from "./anime-select"

interface Guess {
    id: string
    text: string
    isCorrect: boolean
    createdAt: string
}

interface GuessFormProps {
    previousGuesses: Guess[]
    activeScene: {
        id: string
        anime: {
            id: string
            title: string
            titleJp: string | null
            imageUrl: string | null
            synopsis: string | null
        }
    }
}

const MAX_TRIES = 5

export function GuessForm({ previousGuesses, activeScene }: GuessFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string>()
    const [success, setSuccess] = useState<boolean>(false)
    const [mounted, setMounted] = useState(false)
    const [localGuesses, setLocalGuesses] = useState<Guess[]>([])
    const [animes, setAnimes] = useState<Array<{
        id: string
        title: string
        malId: number
        titleJp: string | null
        imageUrl: string | null
    }>>([])
    const [isLoadingAnimes, setIsLoadingAnimes] = useState(true)
    const [selectedAnime, setSelectedAnime] = useState<{
        id: string
        title: string
        malId: number
        titleJp: string | null
        imageUrl: string | null
    } | null>(null)

    useEffect(() => {
        setMounted(true)
        setLocalGuesses(previousGuesses)

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
    }, [previousGuesses])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(undefined)
        setSuccess(false)

        if (!selectedAnime?.id) {
            setError("Please select an anime")
            return
        }

        if (localGuesses.length >= MAX_TRIES) {
            setError("You've used all your tries!")
            return
        }

        const formData = new FormData()
        formData.append("animeId", selectedAnime.id)
        formData.append("sceneId", activeScene.id)

        startTransition(async () => {
            try {
                const result = await submitGuess(formData)

                if ("error" in result) {
                    setError(result.error)
                    return
                }

                setLocalGuesses(prev => [...prev, result.guess])
                setSelectedAnime(null)

                if (result.guess.isCorrect) {
                    setSuccess(true)
                    // Wait for the success message animation before refreshing
                    setTimeout(() => {
                        router.refresh()
                    }, 1000)
                } else if (localGuesses.length + 1 >= MAX_TRIES) {
                    // This was the last try and it was wrong
                    setError("Game Over!")
                } else {
                    // Show "Try again" message for incorrect guesses
                    setError("Not quite right - try again!")
                }
            } catch (e) {
                console.error("Error submitting guess:", e)
                setError("Something went wrong. Please try again.")
            }
        })
    }

    const hasCorrectGuess = localGuesses.some((guess) => guess.isCorrect)
    const hasUsedAllTries = localGuesses.length >= MAX_TRIES
    const remainingTries = MAX_TRIES - localGuesses.length

    // Show loading state during hydration
    if (!mounted) {
        return (
            <div className="anime-card rounded-2xl p-6">
                <div className="h-[92px] animate-pulse" />
            </div>
        )
    }

    return (
        <div className="anime-card relative rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {!hasCorrectGuess && !hasUsedAllTries && (
                    <div className={`mb-4 flex items-center justify-center gap-2 rounded-lg p-3 text-sm ${remainingTries <= 2
                        ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                        : "bg-white/5 text-white/60 ring-1 ring-white/10"
                        }`}>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: MAX_TRIES }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full ${i < remainingTries
                                        ? remainingTries <= 2
                                            ? "bg-red-400"
                                            : "bg-white/60"
                                        : "bg-white/10"
                                        }`}
                                />
                            ))}
                        </div>
                        <span>
                            {remainingTries} {remainingTries === 1 ? 'try' : 'tries'} remaining
                            {remainingTries <= 2 && " - Choose carefully!"}
                        </span>
                    </div>
                )}

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
                        <div className="relative">
                            {isLoadingAnimes ? (
                                <div className="manga-input flex h-11 w-full items-center justify-center">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
                                </div>
                            ) : (
                                <div className="relative">
                                    <AnimeSelect
                                        value={selectedAnime}
                                        onSelect={setSelectedAnime}
                                        placeholder="Search for an anime..."
                                        disabled={hasCorrectGuess || hasUsedAllTries || isPending}
                                        animes={animes}
                                    />
                                </div>
                            )}
                        </div>
                    )}
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
                    disabled={hasCorrectGuess || hasUsedAllTries || isPending || isLoadingAnimes}
                    className="manga-button w-full"
                >
                    {isPending ? "Checking..." : hasCorrectGuess ? "Correct!" : "Submit Guess"}
                </button>
            </form>

            {localGuesses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6"
                >
                    <h3 className="mb-3 text-sm font-medium text-white/60">
                        Your guesses:
                    </h3>
                    <div className="space-y-2">
                        {localGuesses.map((guess, index) => (
                            <motion.div
                                key={guess.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`rounded-xl p-3 ${guess.isCorrect
                                    ? "bg-green-500/5 text-green-300 ring-1 ring-green-500/20"
                                    : "bg-red-500/5 text-red-300 ring-1 ring-red-500/20"
                                    }`}
                            >
                                {guess.text}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {hasCorrectGuess && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 border-t border-white/5 pt-8"
                >
                    <SuccessScreen anime={activeScene.anime} guessCount={localGuesses.length} />
                </motion.div>
            )}

            {hasUsedAllTries && !hasCorrectGuess && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 border-t border-white/5 pt-8"
                >
                    <LoseScreen anime={activeScene.anime} />
                </motion.div>
            )}
        </div>
    )
}
