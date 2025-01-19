import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JikanResponse {
    data: Array<{
        mal_id: number
        title: string
        title_japanese: string
        images: {
            jpg: {
                large_image_url: string
            }
        }
        synopsis: string
        type: string
    }>
    pagination: {
        has_next_page: boolean
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
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

function isBaseAnime(title: string): boolean {
    // Skip sequels (indicated by Roman numerals, season numbers, or parts)
    const sequelPattern = /(\s(II|III|IV|V|VI|VII|VIII|IX|X)|Season\s[2-9]|Part\s[2-9]|\s2nd|\s3rd|\d+th\sSeason)/i
    if (sequelPattern.test(title)) return false

    // Skip anything after a colon (usually indicates a subtitle or sequel)
    const colonPattern = /:.+$/
    if (colonPattern.test(title)) return false

    return true
}

async function main() {
    const processedTitles = new Set<string>()
    let page = 1
    const maxPages = 20 // Limit to 500 anime (25 per page)

    while (page <= maxPages) {
        try {
            console.log(`Fetching page ${page}...`)
            const data = await fetchWithRetry(`https://api.jikan.moe/v4/top/anime?page=${page}`)

            for (const anime of data.data) {
                const baseTitle = anime.title.split(':')[0].trim()

                if (anime.type !== 'TV' || !isBaseAnime(anime.title) || processedTitles.has(baseTitle)) {
                    console.log(`Skipping ${anime.title} - ${!isBaseAnime(anime.title) ? 'Not base series' : 'Already processed'}`)
                    continue
                }

                try {
                    await prisma.anime.upsert({
                        where: { malId: anime.mal_id },
                        update: {
                            title: baseTitle,
                            titleJp: anime.title_japanese || undefined,
                            imageUrl: anime.images.jpg.large_image_url || undefined,
                            synopsis: anime.synopsis || undefined
                        },
                        create: {
                            malId: anime.mal_id,
                            title: baseTitle,
                            titleJp: anime.title_japanese || undefined,
                            imageUrl: anime.images.jpg.large_image_url || undefined,
                            synopsis: anime.synopsis || undefined
                        },
                    })
                    console.log(`Added/Updated: ${baseTitle}`)
                    processedTitles.add(baseTitle)
                } catch (error) {
                    console.error(`Error processing ${baseTitle}:`, error)
                }
            }

            if (!data.pagination.has_next_page || page >= maxPages) break
            page++
            await sleep(2000) // Wait 2 seconds between pages
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error)
            break
        }
    }

    console.log(`Finished processing ${processedTitles.size} unique anime titles`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
