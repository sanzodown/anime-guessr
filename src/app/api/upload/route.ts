import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }
)

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const extension = file.name.split('.').pop()
        const uniqueFileName = `${crypto.randomUUID()}.${extension}`

        const { error: uploadError } = await supabase
            .storage
            .from("scene-videos")
            .upload(uniqueFileName, buffer, {
                contentType: file.type,
                upsert: true,
                cacheControl: "3600"
            })

        if (uploadError) {
            throw uploadError
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from("scene-videos")
            .getPublicUrl(uniqueFileName)

        return NextResponse.json({ url: publicUrl })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get("file")

    if (!file) {
        return new Response("Missing file parameter", { status: 400 })
    }

    try {
        const { error } = await supabase
            .storage
            .from("scene-videos")
            .remove([file])

        if (error) {
            throw error
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error("Error deleting video:", error)
        return new Response("Failed to delete video", { status: 500 })
    }
}
