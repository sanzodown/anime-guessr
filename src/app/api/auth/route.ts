import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        )
    }

    return NextResponse.json({ authenticated: true })
}

export async function POST(request: Request) {
    try {
        const { password } = await request.json()

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            )
        }

        const cookieStore = await cookies()
        cookieStore.set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Auth error:", error)
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        )
    }
}
