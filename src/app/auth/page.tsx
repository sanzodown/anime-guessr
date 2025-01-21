import { redirect } from "next/navigation"

export default async function AuthPage() {
    async function handleCreateUser() {
        "use server"
        redirect("/")
    }

    return (
        <main className="grid-bg relative min-h-screen overflow-hidden px-4 py-16">
            <div className="mx-auto max-w-md text-center">
                <h1 className="animate-glow mb-4 text-4xl font-bold tracking-tight">
                    Welcome to Anime Guessr
                </h1>
                <p className="animate-float mb-8 text-lg text-purple-200/80">
                    Test your anime knowledge with daily clips!
                </p>

                <form action={handleCreateUser}>
                    <button
                        type="submit"
                        className="manga-button w-full text-lg"
                    >
                        Start Playing
                    </button>
                </form>
            </div>

            {/* Background decorative elements */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent" />
            </div>
        </main>
    )
}
