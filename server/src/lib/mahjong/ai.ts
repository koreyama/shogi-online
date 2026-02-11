// Server-side Mahjong AI
import { TileData, TileSuit, Wind } from './types';
import { isWinningHand, getTenpaiWaits, calculateShanten, countTiles } from './hand-evaluator';

interface CallData {
    callType: string;
    tiles: TileData[];
    fromPlayer: number;
}

export interface AiDecision {
    action: 'discard' | 'tsumo' | 'riichi' | 'pon' | 'chi' | 'ron' | 'pass' | 'ankan';
    tileId?: string;
    tiles?: string[]; // for chi
}

/**
 * Decide AI's action after drawing (playing phase)
 */
export function decidePlayAction(
    hand: TileData[],
    calls: CallData[],
    isRiichi: boolean,
    canTsumo: boolean,
): AiDecision {
    // Tsumo if possible
    if (canTsumo) {
        return { action: 'tsumo' };
    }

    // If riichi, must tsumogiri (discard last drawn tile)
    if (isRiichi) {
        return { action: 'discard', tileId: hand[hand.length - 1].id };
    }

    // Check for riichi opportunity
    const callCount = calls.filter(c => c.callType !== 'ankan').length;
    if (callCount === 0) {
        const shanten = calculateShanten(hand.slice(0, hand.length - 1), calls.length);
        if (shanten <= 0) {
            // Find best discard for tenpai
            const best = findBestTenpaiDiscard(hand, calls.length);
            if (best) {
                return { action: 'riichi', tileId: best.id };
            }
        }
    }

    // Check ankan opportunity
    const counts: Record<string, TileData[]> = {};
    for (const t of hand) {
        const key = `${t.suit}-${t.value}`;
        if (!counts[key]) counts[key] = [];
        counts[key].push(t);
    }
    for (const [key, tiles] of Object.entries(counts)) {
        if (tiles.length >= 4 && !isRiichi) {
            return { action: 'ankan', tileId: tiles[0].id };
        }
    }

    // Find best discard using shanten-based evaluation
    const best = findBestDiscard(hand, calls.length);
    return { action: 'discard', tileId: best.id };
}

/**
 * Decide AI's response to a discard (calling phase)
 */
export function decideCallAction(
    hand: TileData[],
    calls: CallData[],
    discardTile: TileData,
    canPon: boolean,
    canChi: boolean,
    canRon: boolean,
): AiDecision {
    // Always ron if possible
    if (canRon) {
        return { action: 'ron' };
    }

    // Pon consideration: only if it reduces shanten
    if (canPon) {
        const currentShanten = calculateShanten(hand, calls.length);
        // Simulate pon
        const afterPonHand = hand.filter(t => {
            const matching = hand.filter(h => h.suit === discardTile.suit && h.value === discardTile.value);
            return !(t.suit === discardTile.suit && t.value === discardTile.value) || matching.indexOf(t) >= 2;
        });
        // Remove 2 matching tiles
        let removed = 0;
        const simHand = hand.filter(t => {
            if (removed < 2 && t.suit === discardTile.suit && t.value === discardTile.value) {
                removed++;
                return false;
            }
            return true;
        });
        const afterShanten = calculateShanten(simHand, calls.length + 1);
        if (afterShanten < currentShanten) {
            return { action: 'pon' };
        }
    }

    // Chi: usually pass for simplicity (AI doesn't chi often)
    // Pass by default
    return { action: 'pass' };
}

function findBestDiscard(hand: TileData[], callCount: number): TileData {
    let bestTile = hand[hand.length - 1];
    let bestScore = -Infinity;

    for (const tile of hand) {
        const remaining = hand.filter(t => t.id !== tile.id);
        const shanten = calculateShanten(remaining, callCount);
        const discardScore = evaluateDiscardValue(tile, hand) - shanten * 100;

        if (discardScore > bestScore) {
            bestScore = discardScore;
            bestTile = tile;
        }
    }

    return bestTile;
}

function findBestTenpaiDiscard(hand: TileData[], callCount: number): TileData | null {
    let bestTile: TileData | null = null;
    let bestWaits = 0;

    for (const tile of hand) {
        const remaining = hand.filter(t => t.id !== tile.id);
        const waits = getTenpaiWaits(remaining, callCount);
        if (waits.length > bestWaits) {
            bestWaits = waits.length;
            bestTile = tile;
        }
    }

    return bestTile;
}

function evaluateDiscardValue(tile: TileData, hand: TileData[]): number {
    let score = 0;

    if (tile.suit === 'honor') {
        const count = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
        if (count === 1) score += 50;
        if (count === 2) score += 10;
        if (tile.value >= 5) score -= 20; // Yakuhai is valuable
    }

    if (tile.suit !== 'honor') {
        if (tile.value === 1 || tile.value === 9) score += 30;
        if (tile.value === 2 || tile.value === 8) score += 15;

        const hasPrev = hand.some(t => t.suit === tile.suit && t.value === tile.value - 1);
        const hasNext = hand.some(t => t.suit === tile.suit && t.value === tile.value + 1);

        if (!hasPrev && !hasNext) score += 40;

        const sameCount = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
        if (sameCount >= 2) score -= 30;
        if (sameCount >= 3) score -= 50;
    }

    return score;
}
