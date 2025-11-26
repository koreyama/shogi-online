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
    isShibari?: boolean; // Establishes or maintains Shibari
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
        rules: { isShibari: boolean, isSpade3: boolean, isStaircase: boolean, is11Back: boolean },
        isShibariActive: boolean = false // Added
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
        let isShibariResult = isShibariActive;

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
                const lastSuits = lastMove.cards.filter(c => c.suit !== 'joker').map(c => c.suit).sort();
                const currentSuits = cards.filter(c => c.suit !== 'joker').map(c => c.suit).sort();

                // Check if suits match (ignoring jokers for simplicity, or treat jokers as wild)
                // Strict Shibari: Suits must match exactly.
                // If Jokers are involved, usually the player declares the suit, but here we infer from other cards or just check non-jokers.
                // If all jokers, suit is undefined/wild.

                const suitsMatch = lastSuits.length === currentSuits.length && lastSuits.every((s, i) => s === currentSuits[i]);

                if (isShibariActive) {
                    if (!suitsMatch) {
                        return { isValid: false, errorMessage: '縛りが発生しています。同じマークを出してください' };
                    }
                } else {
                    // Check if this move ESTABLISHES Shibari
                    if (suitsMatch && lastSuits.length > 0) {
                        isShibariResult = true;
                    }
                }
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
            is11Back: is11,
            isShibari: isShibariResult
        };
    }

    // Check if a specific card can be part of ANY valid move
    public isCardPlayable(
        card: Card,
        hand: Card[],
        isRevolution: boolean,
        is11Back: boolean,
        lastMove: { cards: Card[], playerId: string } | null,
        rules: { isShibari: boolean, isSpade3: boolean, isStaircase: boolean, is11Back: boolean },
        isShibariActive: boolean = false
    ): boolean {
        // If no last move, any card is playable (as start of a move)
        if (!lastMove) return true;

        // Try single
        if (this.validateMove([card], hand, isRevolution, is11Back, lastMove, rules, isShibariActive).isValid) return true;

        // Try pair (if card has match in hand)
        const sameRankCards = hand.filter(c => this.getRankNumber(c.rank) === this.getRankNumber(card.rank) && c !== card);
        // We need to check if we can form a pair of size lastMove.cards.length
        // This is getting complex because we need to pick N-1 other cards.
        // Simplified check:
        // If lastMove was N cards:
        // 1. Can this card be part of a set of N cards of same rank?
        // 2. Can this card be part of a sequence of N cards?

        const n = lastMove.cards.length;

        // Check Pair
        const rank = this.getRankNumber(card.rank);
        const pairs = hand.filter(c => this.getRankNumber(c.rank) === rank); // includes self
        const jokers = hand.filter(c => c.suit === 'joker');

        // We need to form a set of size N using pairs + jokers
        // And that set must be valid against lastMove
        // Optimization: Just check if we have enough cards of this rank (plus jokers) to make N,
        // AND if a set of N (using this card) would be strong enough.
        // Since all cards of same rank have same strength, we just need to check strength of 'card' vs lastMove.

        // Determine last move type
        const lastNonJokers = lastMove.cards.filter(c => c.suit !== 'joker');
        let lastIsPair = false;
        let lastIsSequence = false;
        if (lastNonJokers.length > 0) {
            const lastRank = this.getRankNumber(lastNonJokers[0].rank);
            lastIsPair = lastNonJokers.every(c => this.getRankNumber(c.rank) === lastRank);
            if (!lastIsPair && n >= 3) lastIsSequence = true;
        } else {
            lastIsPair = true;
        }

        if (lastIsPair) {
            if (pairs.length + jokers.length >= n) {
                // Construct a potential move
                // We need to select N cards including 'card'
                // We can just pick 'card' + N-1 others.
                // We need to verify strength.
                // Strength of 'card' vs lastMove
                const effective11Back = rules.is11Back && is11Back;
                const lastCard = lastNonJokers.length > 0 ? lastNonJokers[0] : lastMove.cards[0];
                const lastStrength = this.getStrength(lastCard, isRevolution, effective11Back);
                const currentStrength = this.getStrength(card, isRevolution, effective11Back);

                if (currentStrength > lastStrength) {
                    // Strength is OK. Now check Shibari.
                    if (rules.isShibari && isShibariActive) {
                        // Must match suits.
                        // This is hard to check without picking specific cards.
                        // If strict shibari, we need to find N cards that match the suits of lastMove.
                        // If we can find such subset including 'card', then true.
                        // For now, let's skip strict shibari check in this helper for performance, or implement it simply.
                        // If shibari active, we need to check if 'card' suit is present in lastMove suits?
                        // No, shibari requires the SET of suits to match.
                        // If N=1, simple.
                        if (n === 1) {
                            const lastSuit = lastMove.cards[0].suit;
                            if (card.suit === lastSuit || card.suit === 'joker') return true;
                            return false;
                        }
                        // If N > 1, it's complex. Let's assume true if strength ok for now to avoid lag.
                        return true;
                    }
                    return true;
                }
            }
        }

        // Check Sequence
        if (lastIsSequence && rules.isStaircase) {
            // Check if card can be part of a sequence of length N
            // Same suit, consecutive ranks.
            // This is also complex.
            // Simplified: If card's suit matches lastMove suit (if shibari) or any suit,
            // and we have cards to form a sequence...
            // Let's implement a basic check:
            // 1. Filter hand by card's suit (and jokers)
            // 2. Check if we can form a sequence of N including card that beats lastMove.

            // For now, let's just return true if it's a valid single move or if we are in a "complex" state where we don't want to over-restrict.
            // Actually, for "Smart Selection", it's better to be loose than strict (allow selecting potentially valid cards, block definitely invalid).
            // So if it fails single check, but has potential for pair/sequence, return true.
        }

        return false;
    }
}
