"use client"

import { motion } from "framer-motion"
import { Share2, Twitter } from "lucide-react"

interface SuccessScreenProps {
    anime: {
        title: string
        titleJp: string | null
        imageUrl: string | null
    }
}

export function SuccessScreen({ anime }: SuccessScreenProps) {
    function handleShare() {
        const text = `I just guessed today's anime on Anime Guessr! It was ${anime.title} 🎯\n\nCan you guess it too? Play at:`
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
        const text = `I just guessed today's anime on Anime Guessr! It was ${anime.title} 🎯\n\nCan you guess it too? Play at:`
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

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-medium text-white"
            >
                You got it! 🎉
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
            >
                {anime.imageUrl && (
                    <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="h-64 w-44 rounded-xl object-cover shadow-xl ring-1 ring-white/10"
                    />
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
            >
                <h3 className="text-xl font-bold text-white">{anime.title}</h3>
                {anime.titleJp && (
                    <p className="mt-1 text-sm italic text-white/60">{anime.titleJp}</p>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
            >
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
                <button
                    onClick={handleTweet}
                    className="flex items-center gap-2 rounded-full bg-[#1DA1F2]/10 px-4 py-2 text-sm font-medium text-[#1DA1F2] ring-1 ring-[#1DA1F2]/20 transition-colors hover:bg-[#1DA1F2]/20"
                >
                    <Twitter className="h-4 w-4" />
                    Tweet
                </button>
            </motion.div>
        </motion.div>
    )
}
