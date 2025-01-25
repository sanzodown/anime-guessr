import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { unstable_cache } from "next/cache"
import { revalidateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import { supabaseAdmin } from "@/lib/supabase-admin"

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
                        titleEn: true,
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

async function uploadImage(url: string, malId: number): Promise<string> {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)

        const buffer = await response.arrayBuffer()
        const fileName = `anime-${malId}.jpg`

        const { error } = await supabaseAdmin
            .storage
            .from("anime-images")
            .upload(fileName, buffer, {
                contentType: "image/jpeg",
                upsert: true
            })

        if (error) throw error

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from("anime-images")
            .getPublicUrl(fileName)

        return publicUrl
    } catch (error) {
        console.error(`Error uploading image for malId ${malId}:`, error)
        return url // Fallback to original URL if upload fails
    }
}

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
        const { id, title, titleJp, titleEn } = body

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
                titleJp,
                titleEn
            },
            select: {
                id: true,
                malId: true,
                title: true,
                titleJp: true,
                titleEn: true,
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { malId, title, titleJp, titleEn, imageUrl, synopsis } = body

        if (!malId || !title) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabaseImageUrl = await uploadImage(imageUrl, malId)

        const anime = await prisma.anime.upsert({
            where: { malId },
            update: {
                title,
                titleJp: titleJp || undefined,
                titleEn: titleEn || undefined,
                imageUrl: supabaseImageUrl,
                synopsis: synopsis || undefined
            },
            create: {
                malId,
                title,
                titleJp: titleJp || undefined,
                titleEn: titleEn || undefined,
                imageUrl: supabaseImageUrl,
                synopsis: synopsis || undefined
            },
        })

        revalidateTag("animes")

        return NextResponse.json(anime)
    } catch (error) {
        console.error("Error adding anime:", error)
        return NextResponse.json(
            { error: "Failed to add anime" },
            { status: 500 }
        )
    }
}
