import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"

const getAnimes = unstable_cache(
    async () => {
        return prisma.anime.findMany({
            select: {
                id: true,
                malId: true,
                title: true,
                titleJp: true,
                imageUrl: true,
            },
            orderBy: {
                title: "asc",
            },
        })
    },
    ["animes-list"],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ["animes"]
    }
)

export async function GET() {
    try {
        const animes = await getAnimes()

        if (!animes || animes.length === 0) {
            return NextResponse.json({ error: "No animes found" }, { status: 404 })
        }

        return NextResponse.json(animes)
    } catch (error) {
        console.error("Error fetching animes:", error)
        return NextResponse.json(
            { error: "Failed to fetch animes" },
            { status: 500 }
        )
    }
}
