import { GuessForm } from "@/components/guess-form"
import { VideoPlayer } from "@/components/video-player"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

async function getActiveScene() {
  return await prisma.scene.findFirst({
    where: { isActive: true },
    include: { anime: true },
  })
}

async function getUserGuesses(sceneId: string) {
  const cookieStore = await cookies()
  const guessesStr = cookieStore.get(`guesses-${sceneId}`)?.value
  return guessesStr ? JSON.parse(guessesStr) : []
}

export default async function Home() {
  const activeScene = await getActiveScene()
  const previousGuesses = activeScene ? await getUserGuesses(activeScene.id) : []

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0118] px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="relative z-10 text-center">
          <h1 className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            Anime Guessr
          </h1>
          <p className="mt-3 text-lg text-purple-200/60">
            Guess which anime this clip is from in 5 tries or less!
          </p>
        </div>

        <div className="relative z-10 mt-12 space-y-8">
          {activeScene ? (
            <>
              <VideoPlayer url={activeScene.videoUrl} />
              <GuessForm previousGuesses={previousGuesses} activeScene={activeScene} />
            </>
          ) : (
            <div className="anime-card flex aspect-video items-center justify-center rounded-2xl">
              <p className="animate-float text-lg text-white/60">
                No scene available yet. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Main gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

        {/* Animated orbs */}
        <div className="absolute left-1/4 top-1/4 h-32 w-32 animate-float rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-48 w-48 animate-float-delayed rounded-full bg-purple-500/10 blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />

        {/* Noise texture */}
        <div className="absolute inset-0 bg-[url('/noise.png')] bg-repeat opacity-5 mix-blend-overlay" />
      </div>
    </main>
  )
}
