import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
    return (
        <main className="grid-bg relative min-h-screen overflow-hidden px-4 py-16">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Game
                    </Link>
                </div>

                <div className="anime-card space-y-8 rounded-2xl p-8">
                    <div>
                        <h1 className="animate-glow mb-4 text-3xl font-bold tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-white/60">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">Overview</h2>
                            <p className="text-white/60">
                                This privacy policy explains how Anime Guessr (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your information when you use our website.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">Information We Collect</h2>
                            <div className="space-y-2">
                                <h3 className="font-medium text-white/70">Game Data</h3>
                                <p className="text-white/60">
                                    We store minimal game-related data to provide the game functionality, including:
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-white/60">
                                    <li>Your game progress</li>
                                    <li>Your guesses for each scene</li>
                                    <li>A randomly generated user ID to track your game sessions</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-medium text-white/70">Analytics</h3>
                                <p className="text-white/60">
                                    We use analytics tools to understand website traffic and usage patterns. This helps us improve the game experience. The analytics data collected includes:
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-white/60">
                                    <li>Pages visited</li>
                                    <li>Time spent on the website</li>
                                    <li>Basic device information (browser type, device type)</li>
                                    <li>General location data (country level only)</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">How We Use Your Data</h2>
                            <p className="text-white/60">
                                We use the collected data solely for:
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-white/60">
                                <li>Providing and maintaining the game functionality</li>
                                <li>Analyzing website traffic to improve user experience</li>
                                <li>Preventing abuse and ensuring fair gameplay</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">Cookies</h2>
                            <p className="text-white/60">
                                We use &ldquo;cookies&rdquo; and similar technologies to help personalize content, tailor and measure ads, and provide a better experience.
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-white/60">
                                <li>Remember your game progress</li>
                                <li>Store your preferences</li>
                                <li>Maintain your session</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">Data Retention</h2>
                            <p className="text-white/60">
                                Game data is stored only for as long as necessary to provide the service. Analytics data is retained for a maximum of 26 months.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">Your Rights</h2>
                            <p className="text-white/60">
                                You have the right to:
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-white/60">
                                <li>Clear your game data by clearing your browser cookies</li>
                                <li>Opt out of analytics by using browser privacy settings or ad-blockers</li>
                                <li>Request deletion of your data by contacting us</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white/80">Contact</h2>
                            <p className="text-white/60">
                                For any privacy-related questions, you can reach us through:
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href="https://github.com/sanzodown/anime-guessr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                                >
                                    GitHub Issues
                                </a>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
            </div>
        </main>
    )
}
