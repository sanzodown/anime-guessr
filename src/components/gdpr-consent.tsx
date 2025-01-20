"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { hasConsented, setConsent } from "@/lib/consent-manager"

export function GDPRConsent() {
    const [showConsent, setShowConsent] = useState(false)

    useEffect(() => {
        // Check if user has already consented
        if (!hasConsented()) {
            setShowConsent(true)
        }
    }, [])

    function handleAccept() {
        setConsent(true)
        setShowConsent(false)
    }

    return (
        <AnimatePresence>
            {showConsent && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl bg-black/90 p-6 shadow-2xl shadow-black/20 ring-1 ring-white/10 backdrop-blur-xl md:left-auto md:right-4 md:w-96"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                            <p className="text-sm text-white/80">
                                We use cookies to enhance your experience and analyze site traffic. By continuing to visit this site you agree to our use of cookies.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAccept}
                                    className="manga-button"
                                >
                                    Accept
                                </button>
                                <a
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-white/60 hover:text-white/80"
                                >
                                    Learn more
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={handleAccept}
                            className="rounded-lg p-1 text-white/40 hover:text-white/60"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
