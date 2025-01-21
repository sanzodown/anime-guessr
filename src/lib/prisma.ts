import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
    return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClientSingleton | undefined
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

export { prisma }
