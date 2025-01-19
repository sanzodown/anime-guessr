import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const scenes = await prisma.scene.findMany({
        select: {
            id: true,
            videoUrl: true,
            startTime: true,
            endTime: true,
            releaseDate: true,
            isActive: true,
            anime: {
                select: {
                    id: true,
                    title: true,
                    titleJp: true,
                    imageUrl: true,
                }
            }
        },
        orderBy: {
            releaseDate: "desc",
        },
    })

    return NextResponse.json(scenes)
}
