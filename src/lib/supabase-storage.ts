interface UploadProgress {
    progress: number
    speed: number
}

export async function uploadVideo(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    })

    if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload video")
    }

    const data = await response.json()
    return data.url
}

export async function deleteVideo(url: string) {
    if (!url) return

    const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
    })

    if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete video")
    }
}
