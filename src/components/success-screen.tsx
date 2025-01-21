"use client"

import { motion } from "framer-motion"
import { Share2, Twitter } from "lucide-react"
import Image from "next/image"

interface SuccessScreenProps {
    anime: {
        title: string
        titleJp: string | null
        imageUrl: string | null
    }
    guessCount: number
}

export function SuccessScreen({ anime, guessCount }: SuccessScreenProps) {
    function handleShare() {
        const text = `I just guessed today's anime on Anime Guessr in ${guessCount} ${guessCount === 1 ? 'try' : 'tries'}! It was ${anime.title} 🎯\n\nCan you guess it too? Play at:`
        if (navigator.share) {
            navigator.share({
                title: "Anime Guessr",
                text,
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(`${text}\n${window.location.href}`)
        }
    }

    function handleTweet() {
        const text = `I just guessed today's anime on Anime Guessr in ${guessCount} ${guessCount === 1 ? 'try' : 'tries'}! It was ${anime.title} 🎯\n\nCan you guess it too? Play at:`
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
        window.open(url, "_blank")
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400 ring-1 ring-green-500/20"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            </motion.div>

            <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-white/90">
                    Congratulations!
                </h2>
                <p className="text-white/60">
                    You got it in <span className="text-white/90">{guessCount} {guessCount === 1 ? 'try' : 'tries'}</span>!
                </p>
            </div>

            {anime.imageUrl && (
                <Image
                    src={anime.imageUrl}
                    alt={anime.title}
                    width={200}
                    height={300}
                    className="mx-auto mb-4 rounded"
                    priority
                />
            )}

            <div className="text-center">
                <h3 className="text-lg font-medium text-white/90">{anime.title}</h3>
                {anime.titleJp && (
                    <p className="mt-1 text-sm text-white/40">{anime.titleJp}</p>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleShare}
                    className="manga-button flex items-center gap-2"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
                <button
                    onClick={handleTweet}
                    className="manga-button flex items-center gap-2"
                >
                    <Twitter className="h-4 w-4" />
                    Tweet
                </button>
            </div>
        </motion.div>
    )
}
