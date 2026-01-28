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

    // Local Rules Triggers
    isRokurokubi?: boolean; // 6-6
    isKyukyusha?: boolean; // 9-9
    skipCount?: number; // Count of 5s
    watashiCount?: number; // Count of 7s
    isQBomber?: boolean; // Contains Q
    bomberCount?: number; // Count of Qs (including wildcards if valid)

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



    public sortHand(hand: Card[], isRevolution: boolean, is11Back: boolean = false): Card[] {
        return [...hand].sort((a, b) => {
            const strengthA = this.getStrength(a, isRevolution, is11Back);
            const strengthB = this.getStrength(b, isRevolution, is11Back);
            if (strengthA !== strengthB) {
                return strengthA - strengthB; // Weakest to Strongest
            }
            const suitOrder: Record<string, number> = { 'diamond': 0, 'club': 1, 'heart': 2, 'spade': 3, 'joker': 4 };
            return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
        });
    }

    public validateMove(
        cards: Card[],
        hand: Card[],
        isRevolution: boolean,
        is11Back: boolean,
        lastMove: { cards: Card[], playerId: string } | null,
        rules: { isShibari: boolean, isSpade3: boolean, isStaircase: boolean, is11Back: boolean },
        isShibariActive: boolean = false
    ): MoveResult {
        if (cards.length === 0) return { isValid: false, errorMessage: 'カードを選択してください' };

        const nonJokers = cards.filter(c => c.suit !== 'joker');
        const jokerCount = cards.length - nonJokers.length;

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
                    // Check Gaps
                    let gaps = 0;
                    for (let i = 0; i < sorted.length - 1; i++) {
                        const diff = this.getRankNumber(sorted[i + 1].rank) - this.getRankNumber(sorted[i].rank);
                        if (diff < 1) { // Duplicate rank in sequence? Invalid.
                            gaps = Infinity;
                            break;
                        }
                        gaps += (diff - 1);
                    }
                    if (jokerCount >= gaps) isSequence = true;
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
            const lastNonJokers = lastMove.cards.filter(c => c.suit !== 'joker');
            let lastIsPair = false;
            let lastIsSequence = false;

            if (lastNonJokers.length > 0) {
                const lastRank = this.getRankNumber(lastNonJokers[0].rank);
                lastIsPair = lastNonJokers.every(c => this.getRankNumber(c.rank) === lastRank);
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

                // If jokers are used, strict suit matching is tricky.
                // Simplified: If current non-joker suits matches a SUBSET of last non-joker suits (if last had fewer jokers? no).
                // Logic: Compare sorted suits.
                // If distinct suits count matches?
                // For simplicity: If sets of suits match exactly (ignoring jokers).
                // But wait, if I use Joker as Heart, I satisfy Heart constraint.
                // Check: Are all 'currentSuits' included in 'lastSuits'?
                // And do I have enough Jokers to cover missing suits?
                // This is getting complex.
                // Simple Shibari: If previous played Hearts, I must play Hearts.
                // If I play Joker, it counts as Wild (Heart).
                // So, check if 'currentSuits' is subset of 'lastSuits'.
                // If so, remaining 'lastSuits' are covered by Jokers? Yes.
                const isSubset = currentSuits.every(s => lastSuits.includes(s));
                const neededJokers = lastSuits.length - currentSuits.length; // Approximate

                // Better Check for Shibari Establishment:
                // If Last satisfied suit constraint X, Current must satisfy X.
                // If Last move established Shibari (suits match previous to LAST), then 'isShibariActive' is true.

                if (isShibariActive) {
                    // Check if current move follows the suit constraint of Last Move.
                    // Constraint: The suits of Last Move.
                    // Does Current Move have same suits? (Jokers are Wild).
                    // So we need: LastSuits <= CurrentSuits + Jokers.
                    // And matching Logic.
                    // Actually, usually Shibari means: Field has specific suits.
                    // LastMove has [Heart, Spade]. Current must be [Heart, Spade].
                    // Current has [Heart, Joker]. Joker becomes Spade. OK.
                    // Current has [Heart, Club]. Club != Spade. Invalid.
                    const missingSuits = lastSuits.filter(ls => !currentSuits.includes(ls));
                    if (missingSuits.length > jokerCount) {
                        return { isValid: false, errorMessage: '縛りが発生しています。同じマークを出してください' };
                    }
                } else {
                    // Check if this move ESTABLISHES Shibari
                    // Logic: LastMove suits == CurrentMove suits.
                    // If so, next move is bound.
                    const missingSuits = lastSuits.filter(ls => !currentSuits.includes(ls));
                    const excessSuits = currentSuits.filter(cs => !lastSuits.includes(cs)); // Should be empty if match

                    if (missingSuits.length <= jokerCount && excessSuits.length === 0 && lastSuits.length > 0) {
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
            // We need to compare LEAD cards.
            // Pair: Any card. Sequence: Weakest card.
            // Since we sorted nonJokers for sequence check, we can use that logic.
            // BUT what if input `cards` is [Joker, 5, 4]?
            // Use getStrength on the weakest NON-JOKER (if exists).
            // If all jokers, strength is Max.

            // Correction for Last Move Lead:
            // If Last Move was [3, 4, 5], Lead is 3.
            // If Last Move was [4, 5, Joker], Lead is 4.
            // Helper to find Lead Strength.

            const getLeadStrength = (c: Card[], isRev: boolean, is11: boolean) => {
                const nj = c.filter(x => x.suit !== 'joker');
                if (nj.length === 0) return 16; // All Jokers -> Strongest
                // Find weakest card
                // Sort by strength
                const sorted = this.sortHand(nj, isRev, is11);
                return this.getStrength(sorted[0], isRev, is11);
            };

            const effective11Back = rules.is11Back && is11Back;
            const lastStrength = getLeadStrength(lastMove.cards, isRevolution, effective11Back);
            const currentStrength = getLeadStrength(cards, isRevolution, effective11Back);

            if (currentStrength <= lastStrength) {
                return { isValid: false, errorMessage: '弱いカードは出せません' };
            }
        }

        const isRev = cards.length >= 4;
        const is8 = nonJokers.length > 0 && nonJokers.some(c => this.getRankNumber(c.rank) === 8);
        const is11 = nonJokers.length > 0 && nonJokers.some(c => this.getRankNumber(c.rank) === 11);

        // Local Rules Detection
        let is66 = false;
        let is99 = false;
        let count5 = 0;
        let count7 = 0;
        let isQ = false;

        if (nonJokers.length > 0) {
            const r = this.getRankNumber(nonJokers[0].rank);
            // Rokurokubi (6-6): Typically requires exactly a Pair of 6s (sometimes more, but standard local is Pair)
            // User source says "2 cards of 6".
            if (isPair && cards.length === 2 && r === 6) is66 = true;

            // Kyukyusha (9-9): "2 cards of 9".
            if (isPair && cards.length === 2 && r === 9) is99 = true;

            // 5 Skip
            if (r === 5) count5 = cards.length;

            // 7 Watashi
            if (r === 7) count7 = cards.length;

            // Q Bomber
            if (r === 12) isQ = true;
        } else {
            // All Jokers case? 
            // Jokers usually assume rank 8/5/7/Q if played alone? 
            // If all jokers, we can assume specific effects if context implies? 
            // Or safer: Jokers alone don't trigger number-specific effects unless declared?
            // Colyseus implementation usually interprets All Jokers as Strongest Pair. Rules usually don't apply.
            // EXCEPT maybe 8-cut if Joke is 8?
            // Let's ignore local rules for All Jokers for simplicity unless specifically asked.
        }

        // Handling Sequence containing special ranks
        if (isSequence) {
            // In sequences (e.g. 5-6-7), rules apply!
            // 5 Skip: If 5 is in sequence? Some rules say no, some yes.
            // User request "5 Skip ... Q Bomber ...".
            // Standard: 
            // 8-cut: Works in sequence.
            // 5 Skip: Usually works.
            // 7 Watashi: Usually works.
            // Q Bomber: Usually works.
            // 66/99: Specific Pair rule. Sequence 5-6-7 doesn't trigger 66.

            // Iterate cards to find special ranks.
            // Note: Joker assumes rank. 
            // Since we sorted `nonJokers` by rank, we can check them.
            // AND inferred jokers.
            // This is hard to infer perfect joker rank in `validateMove` without resolving it.
            // Simplified: Trigger if *explicit* card exists.
            nonJokers.forEach(c => {
                const rn = this.getRankNumber(c.rank);
                if (rn === 5) count5++;
                if (rn === 7) count7++;
                if (rn === 12) isQ = true;
                // 8 and 11 handled above? Check `is8` logic: `some(8)`. Correct.
            });
        }

        return {
            isValid: true,
            isRevolution: isRev,
            is8Cut: is8,
            is11Back: is11,
            isShibari: isShibariResult,
            isRokurokubi: is66,
            isKyukyusha: is99,
            skipCount: count5,
            watashiCount: count7,
            isQBomber: isQ,
            bomberCount: isQ ? cards.length : 0,
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
        // If no last move, any card is playable
        if (!lastMove) return true;

        // Try single
        if (this.validateMove([card], hand, isRevolution, is11Back, lastMove, rules, isShibariActive).isValid) return true;

        // For playing as part of a combination (Pair/Sequence)
        const n = lastMove.cards.length;
        if (n < 2) return false; // Single check already done

        // If card is Joker, it can be ANY rank.
        // It is playable if we can form a set of N cards using Hand satisfying rules.
        if (card.suit === 'joker') {
            // Joker is wildcard. Is there ANY combination in hand of size N (including this joker)?
            // We need to iterate all possible target ranks/sequences.
            // Optimization: Just iterate the ranks present in hand.
            // If Hand has [3, 4]. Last was Pair 5.
            // Joker + 3 = Pair 3 (Too weak). Joker + 4 = Pair 4 (Too weak).
            // Joker + 6 (hypothetical) -> OK.
            // So we need to check if (Any Card in Hand + Joker) beats LastMove.
            // OR (Joker + Joker) beats LastMove.

            // Check Pairs with other cards
            const uniqueRanks = Array.from(new Set(hand.filter(c => c.suit !== 'joker').map(c => c.rank)));
            for (const r of uniqueRanks) {
                // Form a pair using this Rank + Joker(s)
                // Need N cards. Count cards of this rank.
                const rankCards = hand.filter(c => c.rank === r);
                const jokers = hand.filter(c => c.suit === 'joker'); // Includes 'card'

                if (rankCards.length + jokers.length >= n) {
                    // Check strength of this Rank
                    // Construct hypothetical cards
                    const testCards = [...rankCards.slice(0, Math.min(rankCards.length, n)), ...jokers.slice(0, n - Math.min(rankCards.length, n))];
                    if (this.validateMove(testCards, hand, isRevolution, is11Back, lastMove, rules, isShibariActive).isValid) return true;
                }
            }

            // Check Joker-only pair (if N <= joker count)
            const jokers = hand.filter(c => c.suit === 'joker');
            if (jokers.length >= n) {
                if (this.validateMove(jokers.slice(0, n), hand, isRevolution, is11Back, lastMove, rules, isShibariActive).isValid) return true;
            }

            // Check Sequence
            // Iterate all cards, treat them as start of sequence?
            // Expensive. But necessary if Rules.Staircase is on.
            if (rules.isStaircase) {
                // Simplified: If there's any valid sequence involving Joker?
                // If invalid so far, return false?
                // Let's assume playability is mostly about Pair matching for Joker.
                // Sequence with Joker is rare enough that maybe we don't need perfect highlighting?
                // But user asked for it. 
                // If I have [4, Joker]. Last was [3, 4].
                // Can I play [4, Joker] (as 4-5)? Yes.
                // So Joker should be active.
                // If previous steps failed, return true anyway to be safe?
                // "When in doubt, let user try".
                return true;
            }
            return false;
        }

        // If card is NOT Joker (Normal Logic)
        // Check Pair
        const rank = this.getRankNumber(card.rank);
        const pairs = hand.filter(c => this.getRankNumber(c.rank) === rank); // includes self
        const jokers = hand.filter(c => c.suit === 'joker');

        // We look for Pair of size N
        if (pairs.length + jokers.length >= n) {
            // Form optimal pair: All pairs + needed jokers
            const pCount = Math.min(pairs.length, n);
            const jCount = n - pCount;
            const testCards = [...pairs.slice(0, pCount), ...jokers.slice(0, jCount)];
            if (this.validateMove(testCards, hand, isRevolution, is11Back, lastMove, rules, isShibariActive).isValid) return true;
        }

        // Check Sequence
        if (rules.isStaircase && n >= 3) {
            // Can this card be part of a sequence of N?
            // Check if we have neighbors + jokers.
            // Allow loosely if sequence possible.
            // Checking exact validity is complex (Gap filling etc).
            // If we have at least 1 other card of same suit or joker...
            const sameSuit = hand.filter(c => c.suit === card.suit || c.suit === 'joker');
            if (sameSuit.length >= n) return true; // Loose check
        }

        return false;
    }
}
