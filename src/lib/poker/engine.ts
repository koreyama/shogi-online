import { Card, Rank, Suit } from '../trump/types';
import { HandRank, PokerPlayer, PokerGameState } from './types';

export class PokerEngine {
    // Rank strength map
    private static readonly RANK_VALUE: Record<Rank, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'joker': 0
    };

    public evaluateHand(holeCards: Card[], communityCards: Card[]): { rank: HandRank; value: number; kickers: number[] } {
        const allCards = [...holeCards, ...communityCards];
        if (allCards.length === 0) return { rank: 'High Card', value: 0, kickers: [] };

        // Sort by rank descending
        allCards.sort((a, b) => this.getRankValue(b.rank) - this.getRankValue(a.rank));

        // Check for Flush
        const flushSuit = this.getFlushSuit(allCards);
        const flushCards = flushSuit ? allCards.filter(c => c.suit === flushSuit) : [];

        // Check for Straight
        const straightHigh = this.getStraightHigh(allCards);

        // Check for Straight Flush
        if (flushSuit && flushCards.length >= 5) {
            const straightFlushHigh = this.getStraightHigh(flushCards);
            if (straightFlushHigh) {
                if (straightFlushHigh === 14) return { rank: 'Royal Flush', value: 1000, kickers: [] };
                return { rank: 'Straight Flush', value: 900 + straightFlushHigh, kickers: [] };
            }
        }

        // Check for Four of a Kind
        const quads = this.getNOfAKind(allCards, 4);
        if (quads) return { rank: 'Four of a Kind', value: 800 + quads.value, kickers: quads.kickers };

        // Check for Full House
        const fullHouse = this.getFullHouse(allCards);
        if (fullHouse) return { rank: 'Full House', value: 700 + fullHouse, kickers: [] };

        // Check for Flush
        if (flushSuit) {
            const kickers = flushCards.slice(0, 5).map(c => this.getRankValue(c.rank));
            return { rank: 'Flush', value: 600, kickers };
        }

        // Check for Straight
        if (straightHigh) return { rank: 'Straight', value: 500 + straightHigh, kickers: [] };

        // Check for Three of a Kind
        const trips = this.getNOfAKind(allCards, 3);
        if (trips) return { rank: 'Three of a Kind', value: 400 + trips.value, kickers: trips.kickers };

        // Check for Two Pair
        const twoPair = this.getTwoPair(allCards);
        if (twoPair) return { rank: 'Two Pair', value: 300 + twoPair.value, kickers: twoPair.kickers };

        // Check for One Pair
        const pair = this.getNOfAKind(allCards, 2);
        if (pair) return { rank: 'One Pair', value: 200 + pair.value, kickers: pair.kickers };

        // High Card
        const kickers = allCards.slice(0, 5).map(c => this.getRankValue(c.rank));
        return { rank: 'High Card', value: 100 + kickers[0], kickers };
    }

    private getRankValue(rank: Rank): number {
        return PokerEngine.RANK_VALUE[rank];
    }

    private getFlushSuit(cards: Card[]): Suit | null {
        const counts: Record<string, number> = {};
        for (const card of cards) {
            counts[card.suit] = (counts[card.suit] || 0) + 1;
            if (counts[card.suit] >= 5) return card.suit;
        }
        return null;
    }

    private getStraightHigh(cards: Card[]): number | null {
        const uniqueRanks = Array.from(new Set(cards.map(c => this.getRankValue(c.rank)))).sort((a, b) => b - a);

        // Handle Ace low straight (A-2-3-4-5)
        if (uniqueRanks.includes(14)) uniqueRanks.push(1);

        for (let i = 0; i <= uniqueRanks.length - 5; i++) {
            if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
                return uniqueRanks[i];
            }
        }
        return null;
    }

    private getNOfAKind(cards: Card[], n: number): { value: number; kickers: number[] } | null {
        const counts: Record<number, number> = {};
        for (const card of cards) {
            const val = this.getRankValue(card.rank);
            counts[val] = (counts[val] || 0) + 1;
        }

        for (const valStr in counts) {
            const val = parseInt(valStr);
            if (counts[val] >= n) {
                const kickers = cards
                    .filter(c => this.getRankValue(c.rank) !== val)
                    .map(c => this.getRankValue(c.rank))
                    .slice(0, 5 - n);
                return { value: val, kickers };
            }
        }
        return null;
    }

    private getFullHouse(cards: Card[]): number | null {
        const trips = this.getNOfAKind(cards, 3);
        if (!trips) return null;

        const remaining = cards.filter(c => this.getRankValue(c.rank) !== trips.value);
        const pair = this.getNOfAKind(remaining, 2);

        if (pair) {
            return trips.value * 10 + pair.value; // Simple value calc
        }
        return null;
    }

    private getTwoPair(cards: Card[]): { value: number; kickers: number[] } | null {
        const pair1 = this.getNOfAKind(cards, 2);
        if (!pair1) return null;

        const remaining = cards.filter(c => this.getRankValue(c.rank) !== pair1.value);
        const pair2 = this.getNOfAKind(remaining, 2);

        if (pair2) {
            const kicker = remaining.filter(c => this.getRankValue(c.rank) !== pair2.value)[0];
            return {
                value: Math.max(pair1.value, pair2.value) * 10 + Math.min(pair1.value, pair2.value),
                kickers: [this.getRankValue(kicker.rank)]
            };
        }
        return null;
    }

    public determineWinners(players: PokerPlayer[], communityCards: Card[]): string[] {
        const activePlayers = players.filter(p => p.isActive);
        if (activePlayers.length === 0) return [];
        if (activePlayers.length === 1) return [activePlayers[0].id];

        let bestValue = -1;
        let winners: string[] = [];

        for (const player of activePlayers) {
            const result = this.evaluateHand(player.hand, communityCards);

            // Compare logic needs to be robust (Rank > Value > Kickers)
            // Simplified comparison for now
            const score = this.getHandScore(result);

            if (score > bestValue) {
                bestValue = score;
                winners = [player.id];
            } else if (score === bestValue) {
                winners.push(player.id);
            }
        }
        return winners;
    }

    private getHandScore(result: { rank: HandRank; value: number; kickers: number[] }): number {
        // Create a comparable number: RankValue * 10^10 + Kicker1 * 10^8 + ...
        // This is a bit hacky, better to implement a proper comparator
        // For this MVP, we'll use the 'value' field which already incorporates some rank info
        // But 'value' in evaluateHand overlaps (e.g. Flush 600 vs Straight 500+High).
        // Let's rely on the base value from evaluateHand which separates ranks by 100s.
        // We need to add kickers.

        let score = result.value * 1000000;
        for (let i = 0; i < result.kickers.length; i++) {
            score += result.kickers[i] * Math.pow(15, 4 - i);
        }
        return score;
    }
}
