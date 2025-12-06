export type Category =
    | 'Ones' | 'Twos' | 'Threes' | 'Fours' | 'Fives' | 'Sixes'
    | 'Choice' | '4 of a Kind' | 'Full House' | 'S. Straight' | 'L. Straight' | 'Yacht';

export const CATEGORIES: Category[] = [
    'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes',
    'Choice', '4 of a Kind', 'Full House', 'S. Straight', 'L. Straight', 'Yacht'
];

export function calculateScore(category: Category, dice: number[]): number {
    const counts = Array(7).fill(0);
    let sum = 0;
    for (const die of dice) {
        counts[die]++;
        sum += die;
    }

    switch (category) {
        case 'Ones': return counts[1] * 1;
        case 'Twos': return counts[2] * 2;
        case 'Threes': return counts[3] * 3;
        case 'Fours': return counts[4] * 4;
        case 'Fives': return counts[5] * 5;
        case 'Sixes': return counts[6] * 6;

        case 'Choice': return sum;

        case '4 of a Kind':
            for (let i = 1; i <= 6; i++) {
                if (counts[i] >= 4) return sum;
            }
            return 0;

        case 'Full House':
            let hasThree = false;
            let hasTwo = false;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] === 3) hasThree = true;
                if (counts[i] === 2) hasTwo = true;
                if (counts[i] === 5) { hasThree = true; hasTwo = true; } // 5 of a kind covers full house
            }
            return (hasThree && hasTwo) ? sum : 0;

        case 'S. Straight':
            // 1-2-3-4, 2-3-4-5, 3-4-5-6
            let consecutive = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > 0) consecutive++;
                else consecutive = 0;
                if (consecutive >= 4) return 15;
            }
            return 0;

        case 'L. Straight':
            // 1-2-3-4-5, 2-3-4-5-6
            let consecutiveL = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > 0) consecutiveL++;
                else consecutiveL = 0;
                if (consecutiveL >= 5) return 30;
            }
            return 0;

        case 'Yacht':
            for (let i = 1; i <= 6; i++) {
                if (counts[i] === 5) return 50;
            }
            return 0;

        default: return 0;
    }
}
