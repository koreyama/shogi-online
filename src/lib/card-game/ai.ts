import { GameState } from './types';
import { CARDS } from './data/cards';
import { AVATARS } from './data/avatars';

export type AiAction =
    | { type: 'PLAY_CARD'; cardId: string; handIndex: number; targetId?: string }
    | { type: 'MANA_CHARGE'; cardIndices: number[] }
    | { type: 'END_TURN' };

export function computeAiAction(state: GameState, cpuId: string): AiAction {
    const cpu = state.players[cpuId];
    const opponentId = Object.keys(state.players).find(id => id !== cpuId);

    if (!cpu || !opponentId) return { type: 'END_TURN' };

    // 1. Mana Charge Logic (Simple: If MP < 3 and have cards, charge 1)
    // Only charge if we haven't charged this turn (limit check is in engine, but good to check here)
    // For now, let's skip charge to ensure it plays cards first.

    // 2. Play Card Logic
    // Find first playable card
    if (cpu.hand) {
        for (let i = 0; i < cpu.hand.length; i++) {
            const cardId = cpu.hand[i];
            const card = CARDS[cardId];

            if (!card) continue;

            // Check Cost
            let effectiveCost = card.cost;
            if (card.type === 'magic' && AVATARS[cpu.avatarId]?.passiveId === 'arcane_mastery') {
                effectiveCost = Math.max(1, effectiveCost - 1);
            }

            if (cpu.mp >= effectiveCost) {
                // Playable!
                // Determine target (Default to opponent for attacks, self for buffs)
                // Simplified: Engine handles most targeting defaults or ignores targetId for non-targeted cards.
                // But for direct attacks, we might need targetId.
                // Let's assume targetId is opponentId for now.

                return {
                    type: 'PLAY_CARD',
                    cardId: cardId,
                    handIndex: i,
                    targetId: opponentId
                };
            }
        }
    }

    // 3. If no cards playable, End Turn
    return { type: 'END_TURN' };
}
