import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const scenes = await prisma.scene.findMany({
        select: {
            id: true,
            videoUrl: true,
            releaseDate: true,
            isActive: true,
            anime: {
                select: {
                    id: true,
                    title: true,
                    titleJp: true,
                    titleEn: true,
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

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const sceneId = searchParams.get("sceneId")

    if (!sceneId) {
        return new Response("Missing sceneId", { status: 400 })
    }

    try {
        const scene = await prisma.scene.findUnique({
            where: { id: sceneId },
            select: { videoUrl: true }
        })

        if (!scene) {
            return new Response("Scene not found", { status: 404 })
        }

        if (scene.videoUrl) {
            const videoUrl = new URL(scene.videoUrl)
            const filename = videoUrl.pathname.split("/").pop()
            if (filename) {
                await deleteVideo(filename)
            }
        }

        await prisma.scene.delete({
            where: { id: sceneId }
        })

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error("Error deleting scene:", error)
        return new Response("Failed to delete scene", { status: 500 })
    }
}
