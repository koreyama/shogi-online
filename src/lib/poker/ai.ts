import { Card } from '../trump/types';
import { PokerAction, PokerGameState, PokerPlayer } from './types';
import { PokerEngine } from './engine';

export class PokerAI {
    private engine: PokerEngine;

    constructor() {
        this.engine = new PokerEngine();
    }

    public decideAction(gameState: PokerGameState, playerId: string): PokerAction {
        const player = gameState.players[playerId];
        if (!player || !player.isActive) return { type: 'fold' };

        const hand = player.hand;
        const community = gameState.communityCards;
        const currentBet = gameState.currentBet;
        const playerBet = player.currentBet;
        const callAmount = currentBet - playerBet;
        const pot = gameState.pot;

        // Avoid infinite raising wars:
        // If the current bet is already very high relative to the pot or blinds, just call.
        const isBetHigh = callAmount > gameState.bigBlindAmount * 5;
        const isPotCommitted = player.currentBet > player.chips * 0.4;

        // Simple logic for now
        const evaluation = this.engine.evaluateHand(hand, community);
        const handRankValue = evaluation.value; // Approximate strength

        // Random factor
        const random = Math.random();

        // Pre-flop logic
        if (gameState.phase === 'preflop') {
            const holeRank1 = this.getRankValue(hand[0].rank);
            const holeRank2 = this.getRankValue(hand[1].rank);
            const isPair = hand[0].rank === hand[1].rank;
            const highCard = Math.max(holeRank1, holeRank2);

            if (isPair && highCard >= 10) {
                // Strong pair
                if (isBetHigh) return { type: 'call' };
                // Raise only if not already raised too much
                if (currentBet < gameState.bigBlindAmount * 4) {
                    return { type: 'raise', amount: gameState.bigBlindAmount * 2 };
                }
                return { type: 'call' };
            } else if (isPair || highCard >= 12) {
                // Medium hand: Call
                if (callAmount > gameState.bigBlindAmount * 3) return { type: 'fold' };
                return { type: 'call' };
            } else {
                // Weak hand
                if (callAmount > 0) {
                    // Fold mostly
                    if (random > 0.1) return { type: 'fold' };
                    return { type: 'call' };
                } else {
                    return { type: 'check' };
                }
            }
        }

        // Post-flop logic
        // If we have something decent (Pair or better)
        if (evaluation.rank !== 'High Card') {
            // If very strong (Two Pair+), Raise
            if (handRankValue >= 300) {
                // Cap raises
                if (isBetHigh || isPotCommitted) return { type: 'call' };
                return { type: 'raise', amount: Math.max(gameState.bigBlindAmount * 2, callAmount) };
            }
            // Pair: Call if bet isn't too huge
            if (callAmount > pot * 0.5) return { type: 'fold' };
            return { type: 'call' };
        }

        // Bluff chance (rare)
        if (random < 0.05 && callAmount === 0) {
            return { type: 'raise', amount: gameState.bigBlindAmount };
        }

        if (callAmount === 0) return { type: 'check' };
        return { type: 'fold' };
    }

    private getRankValue(rank: string): number {
        const map: Record<string, number> = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'joker': 0
        };
        return map[rank] || 0;
    }
}
