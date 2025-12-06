export interface HitBlowResult {
    hit: number;
    blow: number;
}

export interface GuessRecord {
    guess: string;
    result: HitBlowResult;
}

export function generateSecret(length: number = 4): string {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let secret = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        secret += digits[randomIndex];
        digits.splice(randomIndex, 1);
    }

    return secret;
}

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
