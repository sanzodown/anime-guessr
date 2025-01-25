import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const adminSession = request.cookies.get("admin_session")?.value
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
    const isLoginPage = request.nextUrl.pathname === "/admin/login"

    // If trying to access login page while already logged in, redirect to admin
    if (isLoginPage && adminSession) {
        return NextResponse.redirect(new URL("/admin", request.url))
    }

    // If trying to access admin routes (except login) without session, redirect to login
    if (isAdminRoute && !isLoginPage && !adminSession) {
        return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    if (request.nextUrl.pathname.startsWith('/api/upload')) {
        return NextResponse.next({
            headers: {
                'max-body-size': '50mb',
            },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/admin", "/admin/:path*", "/api/upload"],
}
