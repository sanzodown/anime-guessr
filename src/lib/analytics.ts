import { hasConsented } from "./consent-manager"

declare global {
    interface Window {
        gtag: (...args: any[]) => void
    }
}

export function initializeAnalytics() {
    if (typeof window === "undefined") return

    // Only load analytics if user has consented
    if (!hasConsented()) {
        window.gtag?.("consent", "default", {
            analytics_storage: "denied"
        })
        return
    }

    // Load Google Analytics
    const script = document.createElement("script")
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
    script.async = true
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
        window.dataLayer.push(args)
    }
    window.gtag = gtag
    gtag("js", new Date())
    gtag("config", process.env.NEXT_PUBLIC_GA_ID, {
        page_path: window.location.pathname,
    })
}
