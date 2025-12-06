export interface HitBlowResult {
    hit: number;
    blow: number;
}

export interface GuessRecord {
    guess: string;
    result: HitBlowResult;
}

export const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Orange'];

export function generateSecret(length: number = 4): string {
    const availableColors = [...COLORS];
    let secret = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        // We use a simplified single-char representation for internal logic if needed, 
        // or just comma-separated strings? 
        // Logic currently uses string concatenation: "1234". 
        // For colors, maybe use initials? R, B, G, Y, P, O.
        // Let's use initials for the secret string to keep logic simple: "RBGY"
        // But wait, "Blue" and "Black" (none here). "Green" "Gray".
        // The colors are distinct: R, B, G, Y, P, O.

        const color = availableColors[randomIndex];
        secret += color[0]; // First letter
        availableColors.splice(randomIndex, 1);
    }

    return secret;
}

// Helper to map initials back to full names if needed, or we just handle mapped rendering
export const getColorName = (initial: string) => {
    return COLORS.find(c => c[0] === initial) || initial;
};

export function checkGuess(secret: string, guess: string): HitBlowResult {
    let hit = 0;
    let blow = 0;

    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === secret[i]) {
            hit++;
        } else if (secret.includes(guess[i])) {
            blow++;
        }
    }

    return { hit, blow };
}
