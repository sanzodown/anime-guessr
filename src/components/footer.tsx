"use client"

import { Coffee, Github, Shield } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function Footer() {
    const pathname = usePathname()
    const isAdmin = pathname?.startsWith("/admin")

    if (isAdmin) {
        return null
    }

    return (
        <footer className="flex items-center justify-center gap-4 bg-black/20 p-4 backdrop-blur-sm mt-auto">
            <Link
                href="/privacy"
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10"
            >
                <Shield className="h-4 w-4" />
                Privacy
            </Link>
            <a
                href="https://buymeacoffee.com/sanzodown"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-[#FFDD00]/10 px-4 py-2 text-sm font-medium text-[#FFDD00] ring-1 ring-[#FFDD00]/20 transition-colors hover:bg-[#FFDD00]/20"
            >
                <Coffee className="h-4 w-4" />
                Buy me a coffee
            </a>
            <a
                href="https://github.com/sanzodown/anime-guessr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10"
            >
                <Github className="h-4 w-4" />
                GitHub
            </a>
        </footer>
    )
}
