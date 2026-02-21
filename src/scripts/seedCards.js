import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateCardUid() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < 2; i++) {
        result += letters[crypto.randomInt(0, letters.length)];
    }
    for (let i = 0; i < 3; i++) {
        result += digits[crypto.randomInt(0, digits.length)];
    }
    return result;
}

async function seed() {
    console.log('Starting card seed script...');

    try {
        const { count, error: countError } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            if (countError.code === '42P01') {
                console.error('Error: Table "cards" does not exist. Please run the SQL migration first.');
            } else {
                console.error('Error checking card count:', countError);
            }
            return;
        }

        if (count >= 500) {
            console.log(`Cards already seeded (${count} cards).`);
            return;
        }

        const cardsToGenerate = 500 - count;
        console.log(`Generating ${cardsToGenerate} cards...`);

        const uids = new Set();

        // Fetch existing UIDs to avoid collisions with what's already in the DB
        const { data: existingCards } = await supabase.from('cards').select('card_uid');
        const existingUids = new Set(existingCards?.map(c => c.card_uid) || []);

        while (uids.size < cardsToGenerate) {
            const newUid = generateCardUid();
            if (!existingUids.has(newUid)) {
                uids.add(newUid);
            }
        }

        const cardData = Array.from(uids).map(uid => ({
            card_uid: uid,
            status: 'UNACTIVATED'
        }));

        // Insert in batches to avoid payload limits
        const batchSize = 100;
        for (let i = 0; i < cardData.length; i += batchSize) {
            const batch = cardData.slice(i, i + batchSize);
            const { error: insertError } = await supabase
                .from('cards')
                .insert(batch);

            if (insertError) {
                console.error('Error inserting card batch:', insertError);
                break;
            }
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(cardData.length / batchSize)}`);
        }

        console.log(`Successfully seeded ${cardsToGenerate} cards.`);
    } catch (err) {
        console.error('Unexpected error during seeding:', err);
    }
}

seed();
