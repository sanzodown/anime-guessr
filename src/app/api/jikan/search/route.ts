import { NextRequest, NextResponse } from "next/server"

const JIKAN_API_URL = "https://api.jikan.moe/v4"

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get("q")

        if (!query) {
            return NextResponse.json(
                { error: "Search query is required" },
                { status: 400 }
            )
        }

        const response = await fetch(
            `${JIKAN_API_URL}/anime?q=${encodeURIComponent(query)}&type=tv&sfw=true`
        )

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Error searching anime:", error)
        return NextResponse.json(
            { error: "Failed to search anime" },
            { status: 500 }
        )
    }
}
