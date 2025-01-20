const CONSENT_KEY = "gdpr-consent"

export function hasConsented(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(CONSENT_KEY) === "true"
}

export function setConsent(value: boolean) {
    if (typeof window === "undefined") return
    if (value) {
        localStorage.setItem(CONSENT_KEY, "true")
        initializeAnalytics()
    } else {
        localStorage.removeItem(CONSENT_KEY)
        disableAnalytics()
    }
}

function initializeAnalytics() {
    // Initialize your analytics service here
    // Example for Google Analytics:
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
            analytics_storage: "granted"
        })
    }
}

function disableAnalytics() {
    // Disable analytics tracking
    // Example for Google Analytics:
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
            analytics_storage: "denied"
        })
    }
}
