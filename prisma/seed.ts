import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Generates a unique card UID in the format LLDDD (2 letters + 3 digits)
 * Example: KQ718, AB042
 */
function generateCardUid(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const digits = '0123456789'
    let result = ''
    for (let i = 0; i < 2; i++) {
        // Using crypto.randomInt for cryptographically secure random
        result += letters[crypto.randomInt(0, letters.length)]
    }
    for (let i = 0; i < 3; i++) {
        result += digits[crypto.randomInt(0, digits.length)]
    }
    return result
}

async function main() {
    console.log('Starting seed...')

    // 1. Check if we need to seed
    // Note: Adjust table name if your prisma schema uses plural/different case
    const cardCount = await prisma.card.count()

    if (cardCount >= 500) {
        console.log(`Database already has ${cardCount} cards. Skipping seed.`)
        return
    }

    const cardsToGenerate = 500 - cardCount
    console.log(`Generating ${cardsToGenerate} unique UIDs...`)

    const newCards = []
    const uids = new Set<string>()

    // 2. Fetch existing UIDs to prevent collisions
    const existingCards = await prisma.card.findMany({
        select: { cardUid: true }
    })
    existingCards.forEach(c => uids.add(c.cardUid))

    // 3. Generate unique UIDs
    while (newCards.length < cardsToGenerate) {
        const uid = generateCardUid()
        if (!uids.has(uid)) {
            uids.add(uid)
            newCards.push({
                cardUid: uid,
                status: 'UNACTIVATED',
                profileUid: null,
            })
        }
    }

    // 4. Bulk insert
    // Use createMany if supported by your DB provider (e.g. Postgres)
    await prisma.card.createMany({
        data: newCards,
        skipDuplicates: true,
    })

    console.log(`✅ Successfully seeded ${newCards.length} cards.`)
}

main()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
