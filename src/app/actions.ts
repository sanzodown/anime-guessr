"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
})

const DeleteAnimeSchema = z.object({
    animeId: z.string().min(1)
})

const DeleteSceneSchema = z.object({
    sceneId: z.string().min(1)
})

const SceneSchema = z.object({
    animeId: z.string().min(1),
    videoUrl: z.string().min(1),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
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
            startTime: formData.get("startTime") ? parseFloat(formData.get("startTime")?.toString() || "") : undefined,
            endTime: formData.get("endTime") ? parseFloat(formData.get("endTime")?.toString() || "") : undefined,
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

        // Deactivate any currently active scenes
        await prisma.scene.updateMany({
            where: {
                isActive: true,
            },
            data: {
                isActive: false,
            },
        })

        // Create the new scene
        const scene = await prisma.scene.create({
            data: {
                animeId: validatedFields.data.animeId,
                videoUrl: validatedFields.data.videoUrl,
                startTime: validatedFields.data.startTime,
                endTime: validatedFields.data.endTime,
                releaseDate: validatedFields.data.releaseDate,
                isActive: true,
            },
            include: {
                anime: true,
            },
        })

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
        const validatedFields = DeleteAnimeSchema.safeParse({
            animeId: formData.get("animeId")
        })

        if (!validatedFields.success) {
            return { error: "Invalid anime ID" }
        }

        const { animeId } = validatedFields.data

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

        // Extract filename from videoUrl
        const filename = scene.videoUrl.split("/").pop()
        if (!filename) {
            return { error: "Invalid video URL format" }
        }

        // Delete the video file from VPS
        try {
            const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL}/delete/${filename}`, {
                method: "DELETE",
            })

            if (!deleteResponse.ok) {
                console.error("Failed to delete video file:", await deleteResponse.text())
            }
        } catch (error) {
            console.error("Error deleting video file:", error)
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
