import crypto from 'crypto';

/**
 * Generates a unique card UID in the format LLDDD (2 letters + 3 digits)
 * Example: KQ718, AB042
 */
export function generateCardUid(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    let result = '';

    // Generate 2 random letters
    for (let i = 0; i < 2; i++) {
        const randomIndex = crypto.randomInt(0, letters.length);
        result += letters[randomIndex];
    }

    // Generate 3 random digits
    for (let i = 0; i < 3; i++) {
        const randomIndex = crypto.randomInt(0, digits.length);
        result += digits[randomIndex];
    }

    return result;
}
