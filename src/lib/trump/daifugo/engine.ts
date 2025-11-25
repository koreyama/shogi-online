import { Card } from '../types';
import { Deck } from '../deck';

export type DaifugoRank = 'daifugo' | 'fugo' | 'heimin' | 'hinmin' | 'daihinmin';

export interface DaifugoState {
    turnPlayerId: string;
    fieldCards: Card[]; // Currently on the field
    lastMove: { playerId: string; cards: Card[] } | null;
    passCount: number;
    isRevolution: boolean;
    is11Back: boolean; // Persists until field clear
    finishedPlayers: string[]; // IDs of players who finished
    ranks: Record<string, DaifugoRank>; // playerId -> rank
}

export interface MoveResult {
    isValid: boolean;
    isRevolution?: boolean; // 4+ cards
    is8Cut?: boolean; // Contains 8
    is11Back?: boolean; // Contains J (11)
    isSpade3?: boolean;
    errorMessage?: string;
}

export class DaifugoEngine {
    private state: DaifugoState;
    private deck: Deck;

    constructor(initialState?: DaifugoState) {
        this.deck = new Deck(2); // 2 Jokers
        this.state = initialState || {
            turnPlayerId: '',
            fieldCards: [],
            lastMove: null,
            passCount: 0,
            isRevolution: false,
            is11Back: false,
            finishedPlayers: [],
            ranks: {}
        };
    }

    // Helper to convert rank to number
    private getRankNumber(rank: string): number {
        if (rank === 'A') return 1;
        if (rank === 'J') return 11;
        if (rank === 'Q') return 12;
        if (rank === 'K') return 13;
        return Number(rank);
    }

    // Helper to get card strength
    public getStrength(card: Card, isRevolution: boolean, is11Back: boolean = false): number {
        if (card.suit === 'joker') {
            return 16;
        }

        let rank = this.getRankNumber(card.rank);
        if (rank === 1) rank = 14;
        if (rank === 2) rank = 15;

        const effectiveRevolution = isRevolution !== is11Back;

        if (effectiveRevolution) {
            if (card.rank === '3') return 14;
            if (card.rank === '2') return 3;
            if (card.rank === 'A') return 4;
            return 17 - rank;
        }

        return rank;
    }

    public validateMove(
        cards: Card[],
        hand: Card[],
        isRevolution: boolean,
        is11Back: boolean,
        lastMove: { cards: Card[], playerId: string } | null,
        rules: { isShibari: boolean, isSpade3: boolean, isStaircase: boolean, is11Back: boolean }
    ): MoveResult {
        if (cards.length === 0) return { isValid: false, errorMessage: 'カードを選択してください' };

        const nonJokers = cards.filter(c => c.suit !== 'joker');

        // 2. Check Validity of Combination
        let isPair = false;
        let isSequence = false;

        if (nonJokers.length > 0) {
            const rank = this.getRankNumber(nonJokers[0].rank);
            // Check Pair (all same rank)
            isPair = nonJokers.every(c => this.getRankNumber(c.rank) === rank);

            // Check Sequence (Staircase)
            if (!isPair && rules.isStaircase && cards.length >= 3) {
                const sorted = [...nonJokers].sort((a, b) => this.getRankNumber(a.rank) - this.getRankNumber(b.rank));
                const suit = sorted[0].suit;
                if (sorted.every(c => c.suit === suit)) {
                    let isValidSeq = true;
                    for (let i = 0; i < sorted.length - 1; i++) {
                        if (this.getRankNumber(sorted[i + 1].rank) !== this.getRankNumber(sorted[i].rank) + 1) isValidSeq = false;
                    }
                    if (isValidSeq) isSequence = true;
                }
            }
        } else {
            // All jokers
            isPair = true;
        }

        if (!isPair && !isSequence) {
            return { isValid: false, errorMessage: '出せるカードの組み合わせではありません' };
        }

        // 3. Must beat last move
        if (lastMove) {
            if (cards.length !== lastMove.cards.length) {
                return { isValid: false, errorMessage: '同じ枚数のカードを出してください' };
            }

            // Check combination type match
            // Determine last move type
            const lastNonJokers = lastMove.cards.filter(c => c.suit !== 'joker');
            let lastIsPair = false;
            let lastIsSequence = false;

            if (lastNonJokers.length > 0) {
                const lastRank = this.getRankNumber(lastNonJokers[0].rank);
                lastIsPair = lastNonJokers.every(c => this.getRankNumber(c.rank) === lastRank);
                // If not pair, assume sequence if length >= 3 (and valid previous move)
                if (!lastIsPair && lastMove.cards.length >= 3) lastIsSequence = true;
            } else {
                lastIsPair = true; // All jokers treated as pair
            }

            if (isPair && !lastIsPair) return { isValid: false, errorMessage: '階段には階段で返してください' };
            if (isSequence && !lastIsSequence) return { isValid: false, errorMessage: 'ペアにはペアで返してください' };

            // Shibari Check
            if (rules.isShibari) {
                // TODO: Implement Shibari logic
            }

            // Spade 3 Check
            if (rules.isSpade3) {
                if (lastMove.cards.length === 1 && lastMove.cards[0].suit === 'joker') {
                    if (cards.length === 1 && cards[0].suit === 'spade' && this.getRankNumber(cards[0].rank) === 3) {
                        return { isValid: true, isSpade3: true };
                    }
                }
            }

            // Strength Check
            const myCard = nonJokers.length > 0 ? nonJokers[0] : cards[0];
            const lastCard = lastNonJokers.length > 0 ? lastNonJokers[0] : lastMove.cards[0];

            const effective11Back = rules.is11Back && is11Back;

            const lastStrength = this.getStrength(lastCard, isRevolution, effective11Back);
            const currentStrength = this.getStrength(myCard, isRevolution, effective11Back);

            if (currentStrength <= lastStrength) {
                return { isValid: false, errorMessage: '弱いカードは出せません' };
            }
        }

        const isRev = cards.length >= 4;
        const is8 = nonJokers.length > 0 && this.getRankNumber(nonJokers[0].rank) === 8;
        const is11 = nonJokers.length > 0 && this.getRankNumber(nonJokers[0].rank) === 11;

        return {
            isValid: true,
            isRevolution: isRev,
            is8Cut: is8,
            is11Back: is11
        };
    }
}
