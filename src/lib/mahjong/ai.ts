// Mahjong AI
// CPU対戦用のAIロジック

import { GameState, Tile, Call, TileSuit } from './types';
import { countTiles, getTenpaiWaits, calculateShanten } from './hand-evaluator';
import { removeTileFromHand, isSameTile, getTileKey } from './tiles';

export interface AiAction {
    type: 'discard' | 'riichi' | 'tsumo' | 'pon' | 'chi' | 'kan' | 'ron' | 'pass';
    tileId?: string;
    tiles?: [string, string]; // ポン・チー用
}

/**
 * AIの行動を決定
 */
export function computeAiAction(state: GameState, playerIndex: number): AiAction {
    const player = state.players[playerIndex];

    // ツモ上がりできるならツモ
    if (state.phase === 'tsumo' && state.currentPlayerIndex === playerIndex) {
        return { type: 'tsumo' };
    }

    // ロンできるならロン
    if (state.phase === 'calling' && state.canRon[playerIndex]) {
        return { type: 'ron' };
    }

    // 鳴きの判断（シンプル版：基本的にパス）
    if (state.phase === 'calling' && state.canCall) {
        // TODO: 鳴き判断の高度化
        return { type: 'pass' };
    }

    // 打牌の判断
    if (state.phase === 'playing' && state.currentPlayerIndex === playerIndex) {
        return decideDiscard(player.hand, player.calls, player.isRiichi);
    }

    return { type: 'pass' };
}

/**
 * 打牌を決定
 */
function decideDiscard(hand: Tile[], calls: Call[], isRiichi: boolean): AiAction {
    // リーチ中はツモ切り（最後の牌を切る）
    if (isRiichi) {
        const lastTile = hand[hand.length - 1];
        return { type: 'discard', tileId: lastTile.id };
    }

    // シャンテン数を計算して、最も改善される打牌を選ぶ
    const currentShanten = calculateShanten(hand, calls);

    // 聴牌していたらリーチ可能
    if (currentShanten === 0) {
        const waits = getTenpaiWaits(hand.slice(0, 13), calls);
        if (waits.length > 0) {
            // 待ちが広い牌を切ってリーチ
            const bestDiscard = findBestTenpaiDiscard(hand, calls);
            if (bestDiscard) {
                return { type: 'riichi', tileId: bestDiscard.id };
            }
        }
    }

    // 最も不要な牌を選ぶ
    const bestDiscard = findBestDiscard(hand, calls);
    return { type: 'discard', tileId: bestDiscard.id };
}

/**
 * 聴牌時の最適な打牌を見つける
 */
function findBestTenpaiDiscard(hand: Tile[], calls: Call[]): Tile | null {
    let bestTile: Tile | null = null;
    let bestWaitCount = 0;

    for (const tile of hand) {
        const testHand = removeTileFromHand(hand, tile.id);
        const waits = getTenpaiWaits(testHand, calls);

        if (waits.length > bestWaitCount) {
            bestWaitCount = waits.length;
            bestTile = tile;
        }
    }

    return bestTile;
}

/**
 * 最適な打牌を見つける（シャンテン最適化）
 */
function findBestDiscard(hand: Tile[], calls: Call[]): Tile {
    let bestTile = hand[hand.length - 1]; // デフォルトはツモ切り
    let bestScore = -Infinity;

    for (const tile of hand) {
        const score = evaluateDiscardValue(tile, hand, calls);
        if (score > bestScore) {
            bestScore = score;
            bestTile = tile;
        }
    }

    return bestTile;
}

/**
 * 牌の「捨てやすさ」を評価
 * 高いほど捨てるべき牌
 */
function evaluateDiscardValue(tile: Tile, hand: Tile[], calls: Call[]): number {
    let score = 0;

    // 字牌で孤立しているなら高スコア
    if (tile.suit === 'honor') {
        const count = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
        if (count === 1) score += 50;
        if (count === 2) score += 10;
        // 役牌かどうか（白發中は価値あり）
        if (tile.value >= 5) score -= 20;
    }

    // 数牌の場合
    if (tile.suit !== 'honor') {
        // 端牌（1,9）は使いにくいので捨てやすい
        if (tile.value === 1 || tile.value === 9) {
            score += 30;
        }
        // 2,8もやや捨てやすい
        if (tile.value === 2 || tile.value === 8) {
            score += 15;
        }

        // 孤立牌（前後に牌がない）は捨てやすい
        const hasPrev = hand.some(t => t.suit === tile.suit && t.value === tile.value - 1);
        const hasNext = hand.some(t => t.suit === tile.suit && t.value === tile.value + 1);
        const hasPrev2 = hand.some(t => t.suit === tile.suit && t.value === tile.value - 2);
        const hasNext2 = hand.some(t => t.suit === tile.suit && t.value === tile.value + 2);

        if (!hasPrev && !hasNext && !hasPrev2 && !hasNext2) {
            score += 40; // 完全孤立
        } else if (!hasPrev && !hasNext) {
            score += 20; // 隣がない
        }

        // 同じ牌が複数あると捨てにくい
        const sameCount = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
        if (sameCount >= 2) score -= 30;
        if (sameCount >= 3) score -= 50;
    }

    return score;
}

/**
 * 安全牌を判定（他家の河にある牌は安全）
 */
export function getSafeTiles(state: GameState, playerIndex: number): Tile[] {
    const safeTiles: Tile[] = [];
    const player = state.players[playerIndex];

    // 各プレイヤーの河を確認
    for (let i = 0; i < 4; i++) {
        if (i === playerIndex) continue;
        const opponent = state.players[i];

        // 現物（河にある牌）
        for (const discard of opponent.discards) {
            const isInHand = player.hand.some(t =>
                t.suit === discard.suit && t.value === discard.value
            );
            if (isInHand) {
                const handTile = player.hand.find(t =>
                    t.suit === discard.suit && t.value === discard.value
                );
                if (handTile && !safeTiles.some(t => t.id === handTile.id)) {
                    safeTiles.push(handTile);
                }
            }
        }
    }

    return safeTiles;
}

/**
 * リーチ者がいる場合の安全打牌を選択
 */
export function selectSafeDiscard(state: GameState, playerIndex: number): Tile | null {
    const safeTiles = getSafeTiles(state, playerIndex);
    if (safeTiles.length > 0) {
        return safeTiles[0];
    }
    return null;
}
