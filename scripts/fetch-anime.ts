import { config } from 'dotenv'
import { prisma } from '../src/lib/prisma'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface JikanResponse {
    data: Array<{
        mal_id: number
        title: string
        title_english: string
        title_japanese: string
        images: {
            jpg: {
                large_image_url: string
            }
        }
        synopsis: string
        type: string
        rating: string
        score: number
        popularity: number
        status: string
    }>
    pagination: {
        has_next_page: boolean
        last_visible_page: number
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function uploadImage(url: string, malId: number): Promise<string> {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)

        const buffer = await response.arrayBuffer()
        const fileName = `anime-${malId}.jpg`

        const { data, error } = await supabase
            .storage
            .from('anime-images')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            })

        if (error) throw error

        const { data: { publicUrl } } = supabase
            .storage
            .from('anime-images')
            .getPublicUrl(fileName)

        return publicUrl
    } catch (error) {
        console.error(`Error uploading image for malId ${malId}:`, error)
        return url // Fallback to original URL if upload fails
    }
}

async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<JikanResponse> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url)
            if (response.status === 429) {
                console.log('Rate limited, waiting longer...')
                await sleep(delay * 2)
                continue
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json() as JikanResponse
            if (!data || !Array.isArray(data.data)) {
                throw new Error('Invalid response format')
            }
            return data
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error)
            if (i === retries - 1) throw error
            await sleep(delay)
        }
    }
    throw new Error('Max retries reached')
}

function isVariantTitle(title: string, baseTitle: string): boolean {
    // Exact match check first
    if (title === baseTitle) return false

    const normalizedTitle = title.toLowerCase()
    const normalizedBase = baseTitle.toLowerCase()

    // Common sequel/variant patterns
    const patterns = [
        // Sequels
        `${baseTitle} 2`,
        `${baseTitle} II`,
        `${baseTitle} III`,
        `${baseTitle} IV`,
        `${baseTitle} V`,
        `${baseTitle} Second Season`,
        `${baseTitle} 2nd Season`,
        `${baseTitle}2`,
        // Common separators
        `${baseTitle}:`,
        `${baseTitle} -`,
        `${baseTitle} ～`,
        `${baseTitle} ~`,
        `${baseTitle} (`,
        // Common suffixes
        `${baseTitle} The`,
        `${baseTitle} TV`,
        `${baseTitle} OVA`,
        `${baseTitle} Movie`,
        `${baseTitle} Special`,
        `${baseTitle} Specials`,
        // Specific patterns
        `${baseTitle} A's`,
        `${baseTitle} StrikerS`,
        `${baseTitle} The Second Raid`,
        `${baseTitle} Alternative`,
        `${baseTitle} Unlimited`,
        `${baseTitle} Zero`,
        `${baseTitle} R`,
        `${baseTitle} GT`,
        `${baseTitle} Z`,
        `${baseTitle} ZZ`,
        `${baseTitle} Kai`,
        `${baseTitle} Next`,
        `${baseTitle} Final`,
        `${baseTitle} Encore`,
        `${baseTitle} Plus`,
        `${baseTitle} Ex`,
        `${baseTitle} S`,
        // Year patterns
        `${baseTitle} (`,
        `${baseTitle} [`,
    ]

    // Check if title starts with any pattern
    if (patterns.some(pattern => normalizedTitle.startsWith(normalizedBase) &&
        (normalizedTitle === normalizedBase || normalizedTitle.startsWith(pattern.toLowerCase())))) {
        return true
    }

    // Check for common word boundaries to avoid false positives
    const commonBoundaries = ["!", "?", "♪", "☆", ".", ","]
    if (normalizedTitle.startsWith(normalizedBase) &&
        commonBoundaries.some(b => normalizedTitle.charAt(normalizedBase.length) === b)) {
        return true
    }

    return false
}

function isBaseAnime(title: string, allTitles: string[]): boolean {
    // Check if this title is a variant of any other title
    return !allTitles.some(otherTitle => {
        if (otherTitle === title) return false
        return isVariantTitle(title, otherTitle)
    })
}

async function main() {
    // Fetch top anime sorted by score
    const baseUrl = 'https://api.jikan.moe/v4/top/anime'
    let page = 1
    let hasNextPage = true
    let processedTitles: string[] = []

    while (hasNextPage && page <= 20) { // Limit to top 20 pages (500 anime)
        console.log(`Fetching page ${page} of top anime...`)
        const response = await fetchWithRetry(`${baseUrl}?page=${page}&type=tv&filter=bypopularity`)

        // First pass: collect all titles for better duplicate detection
        const allTitles = response.data
            .filter(anime => anime.type === 'TV' && anime.rating !== 'Rx')
            .map(anime => anime.title)

        // Second pass: process anime
        for (const anime of response.data) {
            // Skip non-TV and hentai
            if (anime.type !== 'TV' || anime.rating === 'Rx') continue

            // Skip if we've seen this title before
            if (processedTitles.includes(anime.title)) continue

            // Skip if this is a variant of an existing title
            if (!isBaseAnime(anime.title, [...processedTitles, ...allTitles])) {
                console.log(`Skipping variant: ${anime.title}`)
                continue
            }

            const imageUrl = anime.images.jpg.large_image_url
            let uploadedImageUrl = null

            try {
                uploadedImageUrl = await uploadImage(imageUrl, anime.mal_id)
            } catch (error) {
                console.error(`Failed to upload image for ${anime.title}:`, error)
            }

            await prisma.anime.upsert({
                where: { malId: anime.mal_id },
                update: {
                    title: anime.title,
                    titleJp: anime.title_japanese || null,
                    titleEn: anime.title_english || null,
                    imageUrl: uploadedImageUrl,
                    synopsis: anime.synopsis || null,
                    updatedAt: new Date()
                },
                create: {
                    malId: anime.mal_id,
                    title: anime.title,
                    titleJp: anime.title_japanese || null,
                    titleEn: anime.title_english || null,
                    imageUrl: uploadedImageUrl,
                    synopsis: anime.synopsis || null
                }
            })

            processedTitles.push(anime.title)
            console.log(`Processed anime: ${anime.title} (Score: ${anime.score}, Popularity: ${anime.popularity})`)
            await sleep(1000) // Rate limiting
        }

        hasNextPage = response.pagination.has_next_page && page < response.pagination.last_visible_page
        page++
        await sleep(4000) // Rate limiting between pages
    }

    console.log(`Finished fetching top anime data. Processed ${processedTitles.length} unique titles.`)
}

main()
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
