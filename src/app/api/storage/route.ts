import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAuthenticated() {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')
    return !!adminSession
}

export async function POST(request: Request) {
    if (!await isAuthenticated()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const extension = file.name.split('.').pop()
        const uniqueFileName = `${crypto.randomUUID()}.${extension}`

        const { error: uploadError } = await adminSupabase
            .storage
            .from("scene-videos")
            .upload(uniqueFileName, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type
            })

        if (uploadError) {
            throw uploadError
        }

        const { data: { publicUrl } } = adminSupabase
            .storage
            .from("scene-videos")
            .getPublicUrl(uniqueFileName)

        return NextResponse.json({ url: publicUrl })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    if (!await isAuthenticated()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const fileName = searchParams.get('file')

        if (!fileName) {
            return NextResponse.json({ error: "No file specified" }, { status: 400 })
        }

        const { error } = await adminSupabase
            .storage
            .from("scene-videos")
            .remove([fileName])

        if (error) {
            throw error
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json(
            { error: "Delete failed" },
            { status: 500 }
        )
    }
}
