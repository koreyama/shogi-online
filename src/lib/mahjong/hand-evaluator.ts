// Mahjong Hand Evaluator
// 聴牌判定・上がり判定・シャンテン数計算

import { Tile, TileSuit, Call } from './types';
import { isSameTile } from './tiles';

/**
 * 手牌を牌種ごとにカウントする
 * 返り値: { man: [0,0,0,0,0,0,0,0,0], pin: [...], sou: [...], honor: [0,0,0,0,0,0,0] }
 */
export function countTiles(tiles: Tile[]): Record<TileSuit, number[]> {
    const counts: Record<TileSuit, number[]> = {
        man: new Array(9).fill(0),
        pin: new Array(9).fill(0),
        sou: new Array(9).fill(0),
        honor: new Array(7).fill(0)
    };

    for (const tile of tiles) {
        if (tile.suit === 'honor') {
            counts.honor[tile.value - 1]++;
        } else {
            counts[tile.suit][tile.value - 1]++;
        }
    }

    return counts;
}

/**
 * 刻子（同じ牌3枚）を抽出
 */
function extractKoutsu(counts: number[]): { remaining: number[], extracted: boolean } {
    const result = [...counts];
    for (let i = 0; i < result.length; i++) {
        if (result[i] >= 3) {
            result[i] -= 3;
            return { remaining: result, extracted: true };
        }
    }
    return { remaining: result, extracted: false };
}

/**
 * 順子（連番3枚）を抽出（数牌のみ）
 */
function extractShuntsu(counts: number[]): { remaining: number[], extracted: boolean } {
    const result = [...counts];
    for (let i = 0; i < result.length - 2; i++) {
        if (result[i] >= 1 && result[i + 1] >= 1 && result[i + 2] >= 1) {
            result[i]--;
            result[i + 1]--;
            result[i + 2]--;
            return { remaining: result, extracted: true };
        }
    }
    return { remaining: result, extracted: false };
}

/**
 * 雀頭（同じ牌2枚）を抽出
 */
function extractPair(counts: number[]): { remaining: number[], pairIndex: number } | null {
    const result = [...counts];
    for (let i = 0; i < result.length; i++) {
        if (result[i] >= 2) {
            result[i] -= 2;
            return { remaining: result, pairIndex: i };
        }
    }
    return null;
}

/**
 * 配列の合計を計算
 */
function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

/**
 * 面子を全て抽出できるかチェック（再帰）
 * isHonor: 字牌かどうか（字牌は順子を作れない）
 */
function canExtractAllMentsu(counts: number[], isHonor: boolean): boolean {
    const total = sum(counts);
    if (total === 0) return true;
    if (total % 3 !== 0) return false;

    // 刻子を試す
    const koutsuResult = extractKoutsu(counts);
    if (koutsuResult.extracted && canExtractAllMentsu(koutsuResult.remaining, isHonor)) {
        return true;
    }

    // 順子を試す（字牌以外）
    if (!isHonor) {
        const shuntsuResult = extractShuntsu(counts);
        if (shuntsuResult.extracted && canExtractAllMentsu(shuntsuResult.remaining, isHonor)) {
            return true;
        }
    }

    return false;
}

/**
 * 通常形（4面子1雀頭）で上がれるかチェック
 */
export function isWinningHand(tiles: Tile[], calls: Call[] = []): boolean {
    // 鳴きを含めて14枚（ツモ含む）かチェック
    const totalTiles = tiles.length + calls.reduce((sum, c) => sum + c.tiles.length, 0);
    if (totalTiles !== 14) return false;

    const counts = countTiles(tiles);

    // 七対子チェック
    if (isChitoitsu(counts)) return true;

    // 国士無双チェック
    if (isKokushiMusou(counts)) return true;

    // 通常形（4面子1雀頭）チェック
    return checkNormalWin(counts);
}

/**
 * 通常形の上がりチェック
 */
function checkNormalWin(counts: Record<TileSuit, number[]>): boolean {
    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    // 各種類で雀頭を試す
    for (const suit of suits) {
        for (let i = 0; i < counts[suit].length; i++) {
            if (counts[suit][i] >= 2) {
                // この牌を雀頭として使う
                const testCounts = {
                    man: [...counts.man],
                    pin: [...counts.pin],
                    sou: [...counts.sou],
                    honor: [...counts.honor]
                };
                testCounts[suit][i] -= 2;

                // 残りが全て面子になるかチェック
                if (
                    canExtractAllMentsu(testCounts.man, false) &&
                    canExtractAllMentsu(testCounts.pin, false) &&
                    canExtractAllMentsu(testCounts.sou, false) &&
                    canExtractAllMentsu(testCounts.honor, true)
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * 七対子かチェック
 */
function isChitoitsu(counts: Record<TileSuit, number[]>): boolean {
    let pairs = 0;
    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    for (const suit of suits) {
        for (const count of counts[suit]) {
            if (count === 2) pairs++;
            else if (count !== 0) return false;
        }
    }

    return pairs === 7;
}

/**
 * 国士無双かチェック
 */
function isKokushiMusou(counts: Record<TileSuit, number[]>): boolean {
    // 幺九牌: 1萬,9萬,1筒,9筒,1索,9索,東,南,西,北,白,發,中
    const yaochu = [
        { suit: 'man' as TileSuit, value: 0 },
        { suit: 'man' as TileSuit, value: 8 },
        { suit: 'pin' as TileSuit, value: 0 },
        { suit: 'pin' as TileSuit, value: 8 },
        { suit: 'sou' as TileSuit, value: 0 },
        { suit: 'sou' as TileSuit, value: 8 },
        { suit: 'honor' as TileSuit, value: 0 },
        { suit: 'honor' as TileSuit, value: 1 },
        { suit: 'honor' as TileSuit, value: 2 },
        { suit: 'honor' as TileSuit, value: 3 },
        { suit: 'honor' as TileSuit, value: 4 },
        { suit: 'honor' as TileSuit, value: 5 },
        { suit: 'honor' as TileSuit, value: 6 },
    ];

    let hasPair = false;
    for (const y of yaochu) {
        const count = counts[y.suit][y.value];
        if (count === 0) return false;
        if (count === 2) {
            if (hasPair) return false; // 2つ以上の対子は不可
            hasPair = true;
        }
    }

    // 幺九牌以外があったらダメ
    const totalYaochu = yaochu.reduce((sum, y) => sum + counts[y.suit][y.value], 0);
    const totalAll = sum(counts.man) + sum(counts.pin) + sum(counts.sou) + sum(counts.honor);

    return totalAll === 14 && totalYaochu === 14 && hasPair;
}

/**
 * 聴牌かどうかチェック（1枚でアガリになる待ち牌があるか）
 * 戻り値: 待ち牌のリスト（{suit, value}）
 */
export function getTenpaiWaits(tiles: Tile[], calls: Call[] = []): { suit: TileSuit, value: number }[] {
    const waits: { suit: TileSuit, value: number }[] = [];
    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    // 手牌が13枚のはず
    if (tiles.length !== 13) return [];

    // 全ての牌を試す
    for (const suit of suits) {
        const maxValue = suit === 'honor' ? 7 : 9;
        for (let value = 1; value <= maxValue; value++) {
            // この牌を追加して上がれるかチェック
            const testTile: Tile = { id: 'test', suit, value };
            const testHand = [...tiles, testTile];

            if (isWinningHand(testHand, calls)) {
                waits.push({ suit, value });
            }
        }
    }

    return waits;
}

/**
 * シャンテン数を計算（何枚変えれば聴牌になるか）
 * 簡易版：通常形のみ対応
 */
export function calculateShanten(tiles: Tile[], calls: Call[] = []): number {
    const counts = countTiles(tiles);

    // 七対子シャンテン
    const chitoitsuShanten = calculateChitoitsuShanten(counts);

    // 国士無双シャンテン
    const kokushiShanten = calculateKokushiShanten(counts);

    // 通常形シャンテン
    const normalShanten = calculateNormalShanten(counts, calls.length);

    return Math.min(chitoitsuShanten, kokushiShanten, normalShanten);
}

/**
 * 七対子のシャンテン数
 */
function calculateChitoitsuShanten(counts: Record<TileSuit, number[]>): number {
    let pairs = 0;
    let singles = 0;
    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    for (const suit of suits) {
        for (const count of counts[suit]) {
            if (count >= 2) pairs++;
            else if (count === 1) singles++;
        }
    }

    // 7対子必要、対子が足りない分がシャンテン数
    return Math.max(0, 6 - pairs);
}

/**
 * 国士無双のシャンテン数
 */
function calculateKokushiShanten(counts: Record<TileSuit, number[]>): number {
    const yaochu = [
        { suit: 'man' as TileSuit, value: 0 },
        { suit: 'man' as TileSuit, value: 8 },
        { suit: 'pin' as TileSuit, value: 0 },
        { suit: 'pin' as TileSuit, value: 8 },
        { suit: 'sou' as TileSuit, value: 0 },
        { suit: 'sou' as TileSuit, value: 8 },
        { suit: 'honor' as TileSuit, value: 0 },
        { suit: 'honor' as TileSuit, value: 1 },
        { suit: 'honor' as TileSuit, value: 2 },
        { suit: 'honor' as TileSuit, value: 3 },
        { suit: 'honor' as TileSuit, value: 4 },
        { suit: 'honor' as TileSuit, value: 5 },
        { suit: 'honor' as TileSuit, value: 6 },
    ];

    let hasPair = false;
    let kinds = 0;

    for (const y of yaochu) {
        const count = counts[y.suit][y.value];
        if (count >= 1) kinds++;
        if (count >= 2) hasPair = true;
    }

    // 13種類揃えて1つ対子 → 13 - kinds - (hasPair ? 1 : 0)
    return 13 - kinds - (hasPair ? 1 : 0);
}

/**
 * 通常形のシャンテン数（簡易計算）
 */
function calculateNormalShanten(counts: Record<TileSuit, number[]>, callCount: number): number {
    // 簡易計算: 面子候補（ペア、塔子、刻子候補）をカウント
    let mentsu = callCount; // 鳴きは完成面子
    let pairs = 0;
    let taatsu = 0; // 塔子（連番2枚）

    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];
    const tempCounts = {
        man: [...counts.man],
        pin: [...counts.pin],
        sou: [...counts.sou],
        honor: [...counts.honor]
    };

    // 刻子を抽出
    for (const suit of suits) {
        for (let i = 0; i < tempCounts[suit].length; i++) {
            while (tempCounts[suit][i] >= 3) {
                tempCounts[suit][i] -= 3;
                mentsu++;
            }
        }
    }

    // 順子を抽出（数牌のみ）
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        for (let i = 0; i < tempCounts[suit].length - 2; i++) {
            while (tempCounts[suit][i] >= 1 && tempCounts[suit][i + 1] >= 1 && tempCounts[suit][i + 2] >= 1) {
                tempCounts[suit][i]--;
                tempCounts[suit][i + 1]--;
                tempCounts[suit][i + 2]--;
                mentsu++;
            }
        }
    }

    // 対子をカウント
    for (const suit of suits) {
        for (let i = 0; i < tempCounts[suit].length; i++) {
            if (tempCounts[suit][i] >= 2) {
                tempCounts[suit][i] -= 2;
                pairs++;
            }
        }
    }

    // 塔子をカウント
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        for (let i = 0; i < tempCounts[suit].length - 1; i++) {
            while (tempCounts[suit][i] >= 1 && tempCounts[suit][i + 1] >= 1) {
                tempCounts[suit][i]--;
                tempCounts[suit][i + 1]--;
                taatsu++;
            }
        }
        // 嵌張
        for (let i = 0; i < tempCounts[suit].length - 2; i++) {
            while (tempCounts[suit][i] >= 1 && tempCounts[suit][i + 2] >= 1) {
                tempCounts[suit][i]--;
                tempCounts[suit][i + 2]--;
                taatsu++;
            }
        }
    }

    // シャンテン数計算
    // 4面子1雀頭に必要: mentsu=4, pairs>=1
    // 基本シャンテン = 8 - 2*mentsu - max(pairs + taatsu, 4 - mentsu) - min(pairs, 1)
    const block = Math.min(pairs + taatsu, 4 - mentsu);
    const hasPair = pairs >= 1 ? 1 : 0;

    return Math.max(0, 8 - 2 * mentsu - block - hasPair);
}
