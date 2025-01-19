"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { login } from "@/app/actions"

export default function AdminLoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string>()

    async function handleSubmit(formData: FormData) {
        setError(undefined)
        const result = await login(formData)

        if ("error" in result) {
            setError(result.error)
            return
        }

        router.push("/admin")
        router.refresh()
    }

    return (
        <main className="grid-bg relative min-h-screen overflow-hidden px-4 py-16">
            <div className="mx-auto max-w-md">
                <h1 className="animate-glow mb-8 text-center text-3xl font-bold tracking-tight">
                    Admin Login
                </h1>

                <form action={handleSubmit} className="anime-card rounded-2xl p-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium text-white/60">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                required
                                className="manga-input w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-white/60">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                required
                                className="manga-input w-full"
                            />
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

                        <button type="submit" className="manga-button w-full">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
