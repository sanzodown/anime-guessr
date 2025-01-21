import { prisma } from '../src/lib/prisma'

async function main() {
    await prisma.anime.create({
        data: {
            title: "Demon Slayer",
            malId: 38000,
            titleJp: "Kimetsu no Yaiba",
            imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
            synopsis: "Ever since the death of his father, the burden of supporting the family has fallen upon Tanjirou Kamado's shoulders..."
        }
    })

    console.log("Database has been seeded")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
