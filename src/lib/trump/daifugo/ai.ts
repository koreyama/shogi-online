import { Card } from '@/lib/trump/types';
import { DaifugoEngine } from './engine';

export class DaifugoAI {
    private engine: DaifugoEngine;

    constructor() {
        this.engine = new DaifugoEngine();
    }

    public computeMove(
        hand: Card[],
        field: Card[],
        isRevolution: boolean,
        is11Back: boolean,
        lastMove: { playerId: string; cards: Card[] } | null,
        rules: { isShibari: boolean, isSpade3: boolean, isStaircase: boolean, is11Back: boolean }
    ): Card[] {
        console.log(`AI computeMove: Hand=${hand.length}, Field=${field.length}, isRev=${isRevolution}, is11Back=${is11Back}`);

        // 1. If it's a free turn (no last move or field cleared), play the weakest valid combination.
        if (!lastMove || field.length === 0) {
            const openingMove = this.findBestOpeningMove(hand, isRevolution);
            console.log(`AI Opening Move: ${openingMove.length} cards`);
            return openingMove;
        }

        // 2. Otherwise, find all valid moves that beat the last move.
        const validMoves = this.findAllValidMoves(hand, isRevolution, is11Back, lastMove, rules);
        console.log(`AI Valid Moves found: ${validMoves.length}`);

        if (validMoves.length === 0) {
            console.log("AI Pass");
            return []; // Pass
        }

        // 3. Simple Strategy: Play the weakest valid move to save strong cards.
        validMoves.sort((a, b) => {
            const strengthA = this.engine.getStrength(a[0], isRevolution, is11Back);
            const strengthB = this.engine.getStrength(b[0], isRevolution, is11Back);
            return strengthA - strengthB;
        });

        console.log(`AI Chose Move: ${validMoves[0].map(c => `${c.suit}${c.rank}`).join(',')}`);
        return validMoves[0];
    }

    private findBestOpeningMove(hand: Card[], isRevolution: boolean): Card[] {
        // Try to play multiple cards if possible (pairs, triples) of low rank.
        // Group hand by rank.
        const groups = this.groupCardsByRank(hand);

        // Sort groups by strength (weakest first).
        const sortedRanks = Object.keys(groups).sort((a, b) => {
            // Use one card from each group to compare strength
            const cardA = groups[a][0];
            const cardB = groups[b][0];
            return this.engine.getStrength(cardA, isRevolution) - this.engine.getStrength(cardB, isRevolution);
        });

        // Strategy: Prefer playing pairs/triples over singles to get rid of cards faster?
        // Or play weakest single?
        // Let's prioritize quantity then weakness.

        for (const rank of sortedRanks) {
            const cards = groups[rank];
            if (cards.length >= 2) {
                return cards; // Play pair/triple
            }
        }

        // If no pairs, play weakest single.
        if (sortedRanks.length > 0) {
            return groups[sortedRanks[0]];
        }

        return []; // Should not happen if hand is not empty
    }

    private findAllValidMoves(
        hand: Card[],
        isRevolution: boolean,
        is11Back: boolean,
        lastMove: { playerId: string; cards: Card[] },
        rules: { isShibari: boolean, isSpade3: boolean, isStaircase: boolean, is11Back: boolean }
    ): Card[][] {
        const moves: Card[][] = [];
        const lastCards = lastMove.cards;
        const count = lastCards.length;

        // Separate Jokers
        const jokers = hand.filter(c => c.suit === 'joker');
        const nonJokers = hand.filter(c => c.suit !== 'joker');

        // Group non-jokers by rank
        const groups = this.groupCardsByRank(nonJokers);

        // 1. Try combinations using non-jokers + jokers
        for (const rank in groups) {
            const cards = groups[rank];
            // We need 'count' cards total.
            // We can use 'cards' + 'jokers'.

            if (cards.length + jokers.length >= count) {
                // We need at least 1 natural card to define the rank (unless we play only jokers, handled later)
                // Generate combinations of natural cards
                // We need 'k' natural cards, where k can be from max(1, count - jokers.length) to min(cards.length, count)

                const minNatural = Math.max(1, count - jokers.length);
                const maxNatural = Math.min(cards.length, count);

                for (let k = minNatural; k <= maxNatural; k++) {
                    const naturalCombs = this.getCombinations(cards, k);
                    const neededJokers = count - k;

                    if (neededJokers > jokers.length) continue; // Should be covered by loop range, but safety check

                    // Get combinations of jokers if we have more than needed? 
                    // Usually any joker is fine. But if we have multiple, we might want to save specific ones?
                    // For simplicity, just take the first 'neededJokers' jokers.
                    // Or generate combinations of jokers too if we want to be exhaustive.
                    const jokerCombs = this.getCombinations(jokers, neededJokers);

                    for (const nComb of naturalCombs) {
                        for (const jComb of jokerCombs) {
                            const combo = [...nComb, ...jComb];
                            const result = this.engine.validateMove(combo, hand, isRevolution, is11Back, lastMove, rules);
                            if (result.isValid) {
                                moves.push(combo);
                            }
                        }
                    }
                }
            }
        }

        // 2. Try Joker-only combinations (if count matches)
        if (jokers.length >= count) {
            const jokerCombs = this.getCombinations(jokers, count);
            for (const combo of jokerCombs) {
                const result = this.engine.validateMove(combo, hand, isRevolution, is11Back, lastMove, rules);
                if (result.isValid) {
                    moves.push(combo);
                }
            }
        }

        return moves;
    }

    private groupCardsByRank(hand: Card[]): Record<string, Card[]> {
        const groups: Record<string, Card[]> = {};
        for (const card of hand) {
            if (!groups[card.rank]) {
                groups[card.rank] = [];
            }
            groups[card.rank].push(card);
        }
        return groups;
    }

    private getCombinations(cards: Card[], k: number): Card[][] {
        if (k === 0) return [[]];
        if (cards.length === 0) return [];

        const first = cards[0];
        const rest = cards.slice(1);

        const combsWithFirst = this.getCombinations(rest, k - 1).map(c => [first, ...c]);
        const combsWithoutFirst = this.getCombinations(rest, k);

        return [...combsWithFirst, ...combsWithoutFirst];
    }
}
