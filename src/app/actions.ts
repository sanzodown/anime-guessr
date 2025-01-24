"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { deleteVideo } from "@/lib/supabase-storage"

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
})

const DeleteSceneSchema = z.object({
    sceneId: z.string().min(1)
})

const SceneSchema = z.object({
    animeId: z.string().min(1),
    videoUrl: z.string().min(1),
    releaseDate: z.string().min(1),
})

export async function login(formData: FormData) {
    const validatedFields = LoginSchema.safeParse({
        username: formData.get("username"),
        password: formData.get("password"),
    })

    if (!validatedFields.success) {
        return { error: "Invalid form data" }
    }

    const { username, password } = validatedFields.data

    if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return { error: "Invalid credentials" }
    }

    const cookieStore = await cookies()
    cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { success: true }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete("admin_session")
    return { success: true }
}

export async function createScene(formData: FormData) {
    try {
        const data = {
            animeId: formData.get("animeId")?.toString(),
            videoUrl: formData.get("videoUrl")?.toString(),
            releaseDate: formData.get("releaseDate")
                ? new Date(formData.get("releaseDate")?.toString() || "").toISOString()
                : undefined,
        }

        console.log("Processing data:", data)

        const validatedFields = SceneSchema.safeParse(data)

        if (!validatedFields.success) {
            console.error("Validation error:", validatedFields.error)
            return { error: "Invalid form data" }
        }

        // Convert release date to midnight UTC
        const releaseDate = new Date(validatedFields.data.releaseDate)
        releaseDate.setUTCHours(0, 0, 0, 0)

        // Get today's date at midnight UTC
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        // Create the new scene
        const scene = await prisma.scene.create({
            data: {
                animeId: validatedFields.data.animeId,
                videoUrl: validatedFields.data.videoUrl,
                releaseDate: releaseDate,
                isActive: releaseDate.getTime() === today.getTime(),
            },
            include: {
                anime: true,
            },
        })

        // If this scene is for today, deactivate all other scenes
        if (releaseDate.getTime() === today.getTime()) {
            await prisma.scene.updateMany({
                where: {
                    id: { not: scene.id },
                    isActive: true,
                },
                data: {
                    isActive: false,
                },
            })
        }

        revalidatePath("/admin")
        revalidatePath("/")
        revalidatePath("/api/animes")
        revalidatePath("/api/scenes")
        revalidateTag("animes")
        revalidateTag("animes-list")
        revalidateTag("active-scene")

        return { success: true, scene }
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error creating scene:", error.message)
            return { error: error.message }
        }
        return { error: "Something went wrong. Please try again." }
    }
}

export async function submitGuess(formData: FormData) {
    try {
        const animeId = formData.get("animeId")
        const sceneId = formData.get("sceneId")

        if (!animeId || !sceneId) {
            return { error: "Missing required fields" }
        }

        const scene = await prisma.scene.findUnique({
            where: { id: sceneId as string },
            include: { anime: true },
        })

        if (!scene) {
            return { error: "Scene not found" }
        }

        const isCorrect = scene.animeId === animeId

        const cookieStore = await cookies()
        const guessesStr = cookieStore.get(`guesses-${sceneId}`)?.value
        const guesses = guessesStr ? JSON.parse(guessesStr) : []

        const anime = await prisma.anime.findUnique({
            where: { id: animeId as string },
        })

        if (!anime) {
            return { error: "Anime not found" }
        }

        const newGuess = {
            id: crypto.randomUUID(),
            text: anime.title,
            isCorrect,
            createdAt: new Date().toISOString(),
        }

        cookieStore.set(`guesses-${sceneId}`, JSON.stringify([...guesses, newGuess]), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return { success: true, guess: newGuess }
    } catch (error) {
        console.error("Error submitting guess:", error)
        return { error: "Something went wrong. Please try again." }
    }
}

export async function getUserGuesses(sceneId: string) {
    const cookieStore = await cookies()
    const guessesStr = cookieStore.get(`guesses-${sceneId}`)?.value
    return guessesStr ? JSON.parse(guessesStr) : []
}

export async function deleteAnime(formData: FormData) {
    try {
        const animeId = formData.get("animeId")
        if (!animeId || typeof animeId !== "string") {
            return { error: "Invalid anime ID" }
        }

        // First check if there are any scenes using this anime
        const scenesCount = await prisma.scene.count({
            where: { animeId }
        })

        if (scenesCount > 0) {
            return { error: "Cannot delete anime that has scenes. Delete the scenes first." }
        }

        await prisma.anime.delete({
            where: { id: animeId }
        })

        revalidatePath("/admin")
        revalidatePath("/")
        revalidatePath("/api/animes")
        revalidatePath("/api/scenes")
        revalidateTag("animes")
        revalidateTag("animes-list")
        revalidateTag("active-scene")
        return { success: true }
    } catch (error) {
        console.error("Error deleting anime:", error)
        return { error: "Failed to delete anime" }
    }
}

export async function deleteScene(formData: FormData) {
    try {
        const validatedFields = DeleteSceneSchema.safeParse({
            sceneId: formData.get("sceneId")
        })

        if (!validatedFields.success) {
            return { error: "Invalid scene ID" }
        }

        const { sceneId } = validatedFields.data

        // Get the scene's videoUrl before deleting it
        const scene = await prisma.scene.findUnique({
            where: { id: sceneId },
            select: { videoUrl: true }
        })

        if (!scene) {
            return { error: "Scene not found" }
        }

        // Delete the video from Supabase storage
        try {
            // Extract just the filename from the URL
            const filename = scene.videoUrl.split("/").pop()
            if (filename) {
                await deleteVideo(filename)
            }
        } catch (error) {
            console.error("Error deleting video:", error)
        }

        // Delete the scene from the database
        await prisma.scene.delete({
            where: { id: sceneId }
        })

        revalidatePath("/admin")
        revalidatePath("/")
        revalidatePath("/api/animes")
        revalidatePath("/api/scenes")
        revalidateTag("animes")
        revalidateTag("animes-list")
        revalidateTag("active-scene")

        return { success: true }
    } catch (error) {
        console.error("Error deleting scene:", error)
        return { error: "Failed to delete scene" }
    }
}

export async function getActiveScene() {
    try {
        return prisma.scene.findFirst({
            where: {
                isActive: true,
                releaseDate: {
                    lte: new Date(),
                },
            },
            include: {
                anime: {
                    select: {
                        id: true,
                        title: true,
                        titleJp: true,
                        imageUrl: true,
                        synopsis: true,
                    }
                }
            },
        })
    } catch (error) {
        console.error("Error fetching active scene:", error)
        return null
    }
}
