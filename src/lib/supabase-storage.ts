export async function uploadVideo(file: File, onProgress?: (progress: number, speed: number, timeRemaining?: number) => void) {
    try {
        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            const formData = new FormData()
            formData.append("file", file)

            let lastLoaded = 0
            let lastTime = Date.now()

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const currentTime = Date.now()
                    const timeDiff = (currentTime - lastTime) / 1000
                    const loadedDiff = event.loaded - lastLoaded
                    const currentSpeed = timeDiff > 0 ? loadedDiff / timeDiff : 0

                    const progress = (event.loaded / event.total) * 100
                    const timeRemaining = currentSpeed > 0
                        ? (event.total - event.loaded) / currentSpeed
                        : undefined

                    onProgress(progress, currentSpeed, timeRemaining)

                    lastLoaded = event.loaded
                    lastTime = currentTime
                }
            })

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText)
                        if (response.url) {
                            resolve(response.url)
                        } else {
                            reject(new Error("Invalid response format"))
                        }
                    } catch {
                        reject(new Error("Failed to parse response"))
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText)
                        reject(new Error(error.error || "Upload failed"))
                    } catch {
                        reject(new Error(`Upload failed with status ${xhr.status}`))
                    }
                }
            }

            xhr.onerror = () => reject(new Error("Network error occurred"))

            xhr.open("POST", "/api/upload")
            xhr.send(formData)
        })
    } catch (error) {
        console.error("Upload error:", error)
        throw error
    }
}

export async function deleteVideo(fileName: string) {
    // For absolute URLs (like those from Supabase), extract just the filename
    const filename = fileName.includes('/') ? fileName.split('/').pop()! : fileName

    try {
        const response = await fetch(`/api/upload?file=${encodeURIComponent(filename)}`, {
            method: "DELETE",
        })

        if (response.status === 204 || response.status === 404) {
            return
        }

        const data = await response.json()
        console.warn("Delete warning:", data.error || "Unexpected response")
    } catch (fetchError: unknown) {
        if (fetchError instanceof Error && !fetchError.message.includes('Failed to parse URL')) {
            console.warn("Delete warning:", fetchError)
        }
    }
}
