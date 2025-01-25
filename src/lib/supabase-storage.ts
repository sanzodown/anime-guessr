async function ensureAuthenticated() {
    const adminSessionResponse = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include'
    })

    if (!adminSessionResponse.ok) {
        throw new Error('Not authenticated - Access denied')
    }
}

export async function uploadVideo(file: File) {
    try {
        await ensureAuthenticated()

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/storage', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Upload failed')
        }

        const { url } = await response.json()
        return url
    } catch (error) {
        console.error("Upload error:", error)
        throw error
    }
}

export async function deleteVideo(fileName: string) {
    try {
        await ensureAuthenticated()

        const filename = fileName.includes('/') ? fileName.split('/').pop()! : fileName

        const response = await fetch(`/api/storage?file=${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            credentials: 'include'
        })

        if (!response.ok && response.status !== 404) {
            const error = await response.json()
            throw new Error(error.error || 'Delete failed')
        }
    } catch (error: unknown) {
        if (error instanceof Error && !error.message.includes('Failed to parse URL')) {
            console.warn("Delete warning:", error)
        }
    }
}
