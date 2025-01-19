import { cookies } from "next/headers"
import { NextResponse } from "next/server"

function generateUserId() {
    return Math.random().toString(36).substring(2)
}

export async function GET() {
    try {
        const cookieStore = await cookies()
        const existingUserId = await cookieStore.get("userId")

        if (existingUserId?.value) {
            return NextResponse.json({ userId: existingUserId.value })
        }

        const userId = generateUserId()
        const response = NextResponse.json({ userId })

        response.cookies.set({
            name: "userId",
            value: userId,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 365, // 1 year
        })

        return response
    } catch (error) {
        console.error("Error handling user ID:", error)
        return NextResponse.json({ userId: generateUserId() }, { status: 500 })
    }
}
