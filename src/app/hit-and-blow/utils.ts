export interface HitBlowResult {
    hit: number;
    blow: number;
}

export interface GuessRecord {
    guess: string;
    result: HitBlowResult;
    player?: string;
}

export const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Orange'];

export function generateSecret(length: number = 4, allowDuplicates: boolean = false): string {
    const availableColors = [...COLORS];
    let secret = '';

    for (let i = 0; i < length; i++) {
        // If duplicates are allowed, we don't remove from availableColors
        // But if NOT allowed, we must pick from remaining
        const pool = allowDuplicates ? COLORS : availableColors;
        const randomIndex = Math.floor(Math.random() * pool.length);
        const color = pool[randomIndex];
        secret += color[0];

        if (!allowDuplicates) {
            availableColors.splice(randomIndex, 1);
        }
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

    const secretArr = secret.split('');
    const guessArr = guess.split('');
    const secretUsed = new Array(secret.length).fill(false);
    const guessUsed = new Array(guess.length).fill(false);

    // 1. Check Hits
    for (let i = 0; i < guess.length; i++) {
        if (guessArr[i] === secretArr[i]) {
            hit++;
            secretUsed[i] = true;
            guessUsed[i] = true;
        }
    }

    // 2. Check Blows
    for (let i = 0; i < guess.length; i++) {
        if (guessUsed[i]) continue;

        const char = guessArr[i];
        // Find a matching unused character in secret
        for (let j = 0; j < secret.length; j++) {
            if (!secretUsed[j] && secretArr[j] === char) {
                blow++;
                secretUsed[j] = true;
                break;
            }
        }
    }

    return { hit, blow };
}
