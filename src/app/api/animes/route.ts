import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { revalidateTag } from "next/cache"
import { Prisma } from "@prisma/client"

const getAnimes = unstable_cache(
    async (page: number, limit: number, search?: string) => {
        const skip = (page - 1) * limit
        const where: Prisma.AnimeWhereInput = search ? {
            OR: [
                { title: { mode: 'insensitive', contains: search } },
                { titleJp: { mode: 'insensitive', contains: search } }
            ]
        } : {}

        try {
            const [animes, total] = await Promise.all([
                prisma.anime.findMany({
                    where,
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
                    skip,
                    take: limit,
                }),
                prisma.anime.count({ where })
            ])

            return { animes, total }
        } catch (error) {
            console.error("Error fetching animes:", error)
            throw error
        }
    },
    ["animes-list"],
    {
        revalidate: 3600,
        tags: ["animes"]
    }
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") ?? "1")
        const limit = parseInt(searchParams.get("limit") ?? "10")
        const search = searchParams.get("search") ?? undefined

        const { animes, total } = await getAnimes(page, limit, search)

        if (!animes || animes.length === 0) {
            return NextResponse.json({
                animes: [],
                total: 0,
                page,
                limit
            })
        }

        return NextResponse.json({
            animes,
            total,
            page,
            limit
        })
    } catch (error) {
        console.error("Error fetching animes:", error)
        return NextResponse.json(
            { error: "Failed to fetch animes" },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, title, titleJp } = body

        if (!id || !title) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const updatedAnime = await prisma.anime.update({
            where: { id },
            data: {
                title,
                titleJp
            },
            select: {
                id: true,
                malId: true,
                title: true,
                titleJp: true,
                imageUrl: true,
            }
        })

        revalidateTag("animes")

        return NextResponse.json(updatedAnime)
    } catch (error) {
        console.error("Error updating anime:", error)
        return NextResponse.json(
            { error: "Failed to update anime" },
            { status: 500 }
        )
    }
}
