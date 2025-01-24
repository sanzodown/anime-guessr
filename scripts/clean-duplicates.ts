import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function cleanDuplicateAnimes() {
    console.log("Starting similar titles cleanup...")
    let totalDeleted = 0

    // Get all animes
    const allAnimes = await prisma.anime.findMany({
        include: {
            _count: {
                select: {
                    scenes: true
                }
            }
        }
    })

    // First, handle exact duplicates
    const titleGroups = new Map<string, typeof allAnimes>()
    for (const anime of allAnimes) {
        if (!titleGroups.has(anime.title)) {
            titleGroups.set(anime.title, [])
        }
        titleGroups.get(anime.title)!.push(anime)
    }

    // Clean up exact duplicates first
    for (const [title, animes] of titleGroups) {
        if (animes.length > 1) {
            // Sort by malId (keep the lowest) and scene count
            const sorted = animes.sort((a, b) => {
                if (a.malId && b.malId) {
                    return a.malId - b.malId
                }
                return b._count.scenes - a._count.scenes
            })

            const keep = sorted[0]
            const toDelete = sorted.slice(1)
            totalDeleted += toDelete.length

            console.log(`\nExact duplicates for: "${title}"`)
            console.log(`Keeping: MAL ID ${keep.malId} (${keep._count.scenes} scenes)`)
            console.log(`Deleting: ${toDelete.map(a => `MAL ID ${a.malId} (${a._count.scenes} scenes)`).join(", ")}`)

            // Update scenes to point to the kept anime
            for (const anime of toDelete) {
                await prisma.scene.updateMany({
                    where: { animeId: anime.id },
                    data: { animeId: keep.id }
                })
            }

            // Delete duplicates
            await prisma.anime.deleteMany({
                where: {
                    id: { in: toDelete.map(a => a.id) }
                }
            })
        }
    }

    // Now handle variants and sequels
    const variantGroups = new Map<string, typeof allAnimes>()

    const isVariantTitle = (title: string, baseTitle: string) => {
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

    // First pass: collect base titles
    const baseTitles = new Set<string>()
    for (const anime of allAnimes) {
        let isVariant = false
        for (const other of allAnimes) {
            if (other.id === anime.id) continue
            if (isVariantTitle(anime.title, other.title)) {
                isVariant = true
                baseTitles.add(other.title)
                break
            }
        }
        if (!isVariant) {
            baseTitles.add(anime.title)
        }
    }

    // Second pass: group variants with their base titles
    for (const baseTitle of baseTitles) {
        const variants = allAnimes.filter(anime =>
            anime.title === baseTitle || isVariantTitle(anime.title, baseTitle)
        )
        if (variants.length > 0) {
            variantGroups.set(baseTitle, variants)
        }
    }

    // Process each variant group
    for (const [baseTitle, animes] of variantGroups) {
        if (animes.length === 1) continue // Skip if no variants found

        // Sort by title length and scene count
        const sorted = animes.sort((a, b) => {
            const aIsBase = a.title === baseTitle
            const bIsBase = b.title === baseTitle
            if (aIsBase && !bIsBase) return -1
            if (!aIsBase && bIsBase) return 1
            return b._count.scenes - a._count.scenes
        })

        const keep = sorted[0]
        const toDelete = sorted.slice(1)
        totalDeleted += toDelete.length

        console.log(`\nBase title: "${baseTitle}"`)
        console.log(`Keeping: ${keep.title} (${keep._count.scenes} scenes)`)
        console.log(`Deleting: ${toDelete.map(a => `"${a.title}" (${a._count.scenes} scenes)`).join(", ")}`)

        // Update scenes to point to the kept anime
        for (const anime of toDelete) {
            await prisma.scene.updateMany({
                where: { animeId: anime.id },
                data: { animeId: keep.id }
            })
        }

        // Delete the variant animes
        await prisma.anime.deleteMany({
            where: {
                id: { in: toDelete.map(a => a.id) }
            }
        })
    }

    console.log(`\nCleanup complete! Deleted ${totalDeleted} anime entries.`)
}

cleanDuplicateAnimes()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
