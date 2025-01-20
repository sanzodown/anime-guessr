import { motion } from "framer-motion"
import { Share2, Twitter } from "lucide-react"

interface LoseScreenProps {
    anime: {
        title: string
        titleJp: string | null
        imageUrl: string | null
    }
}

export function LoseScreen({ anime }: LoseScreenProps) {
    function handleShare() {
        const text = `I couldn't guess today's anime on Anime Guessr. It was ${anime.title} 😔\n\nCan you do better? Play at:`
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
        const text = `I couldn't guess today's anime on Anime Guessr. It was ${anime.title} 😔\n\nCan you do better? Play at:`
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
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
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
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </motion.div>

            <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-white/90">Game Over!</h2>
            </div>

            {anime.imageUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                >
                    <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="h-64 w-44 rounded-xl object-cover shadow-xl ring-1 ring-white/10"
                    />
                </motion.div>
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
