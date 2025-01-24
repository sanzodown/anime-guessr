import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import crypto from "crypto"

function generateUUID(): string {
    return crypto.randomUUID()
}

function getExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

        const extension = getExtension(file.name)
        const uniqueFileName = `${generateUUID()}.${extension}`

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
    try {
        const { searchParams } = new URL(request.url)
        const url = searchParams.get("url")

        if (!url) {
            return NextResponse.json(
                { error: "No file URL provided" },
                { status: 400 }
            )
        }

        // Extract filename from Supabase URL
        const fileName = url.split("/").pop()?.split("?")[0]
        if (!fileName) {
            return NextResponse.json(
                { error: "Invalid file URL" },
                { status: 400 }
            )
        }

        const { error: deleteError } = await supabase
            .storage
            .from("scene-videos")
            .remove([fileName])

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        )
    }
}
