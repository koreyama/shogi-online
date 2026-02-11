// Server-side Mahjong Hand Evaluator
// Ported from client lib for server-side win validation

import { TileData, TileSuit } from './types';

/** Count tiles by suit and value */
export function countTiles(tiles: TileData[]): Record<TileSuit, number[]> {
    const counts: Record<TileSuit, number[]> = {
        man: new Array(9).fill(0),
        pin: new Array(9).fill(0),
        sou: new Array(9).fill(0),
        honor: new Array(7).fill(0),
    };
    for (const t of tiles) {
        const maxIdx = t.suit === 'honor' ? 7 : 9;
        const idx = t.value - 1;
        if (idx >= 0 && idx < maxIdx) {
            counts[t.suit][idx]++;
        }
    }
    return counts;
}

function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

/** Check if all mentsu can be extracted (recursive backtracking) */
function canExtractAllMentsu(counts: number[], isHonor: boolean): boolean {
    const total = sum(counts);
    if (total === 0) return true;

    // Try koutsu (triplet)
    for (let i = 0; i < counts.length; i++) {
        if (counts[i] >= 3) {
            const next = [...counts];
            next[i] -= 3;
            if (canExtractAllMentsu(next, isHonor)) return true;
        }
    }

    // Try shuntsu (sequence) - number tiles only
    if (!isHonor) {
        for (let i = 0; i < counts.length - 2; i++) {
            if (counts[i] >= 1 && counts[i + 1] >= 1 && counts[i + 2] >= 1) {
                const next = [...counts];
                next[i]--;
                next[i + 1]--;
                next[i + 2]--;
                if (canExtractAllMentsu(next, isHonor)) return true;
            }
        }
    }

    return false;
}

/** Check normal win (4 mentsu + 1 jantou) */
function checkNormalWin(counts: Record<TileSuit, number[]>): boolean {
    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    // Try each possible pair
    for (const suit of suits) {
        const maxIdx = suit === 'honor' ? 7 : 9;
        for (let i = 0; i < maxIdx; i++) {
            if (counts[suit][i] >= 2) {
                // Remove pair
                const testCounts: Record<TileSuit, number[]> = {
                    man: [...counts.man],
                    pin: [...counts.pin],
                    sou: [...counts.sou],
                    honor: [...counts.honor],
                };
                testCounts[suit][i] -= 2;

                // Check if remaining tiles form valid mentsu
                let valid = true;
                for (const s of suits) {
                    if (!canExtractAllMentsu(testCounts[s], s === 'honor')) {
                        valid = false;
                        break;
                    }
                }
                if (valid) return true;
            }
        }
    }
    return false;
}

/** Check chitoitsu (seven pairs) */
function isChitoitsu(counts: Record<TileSuit, number[]>): boolean {
    let pairs = 0;
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const c of counts[suit]) {
            if (c === 1 || c === 3) return false;
            if (c === 2) pairs++;
            if (c === 4) pairs += 2; // Count as 2 pairs for 4 of a kind
        }
    }
    return pairs === 7;
}

/** Check kokushi musou (thirteen orphans) */
function isKokushiMusou(counts: Record<TileSuit, number[]>): boolean {
    const required = [
        { suit: 'man' as TileSuit, value: 1 }, { suit: 'man' as TileSuit, value: 9 },
        { suit: 'pin' as TileSuit, value: 1 }, { suit: 'pin' as TileSuit, value: 9 },
        { suit: 'sou' as TileSuit, value: 1 }, { suit: 'sou' as TileSuit, value: 9 },
        { suit: 'honor' as TileSuit, value: 1 }, { suit: 'honor' as TileSuit, value: 2 },
        { suit: 'honor' as TileSuit, value: 3 }, { suit: 'honor' as TileSuit, value: 4 },
        { suit: 'honor' as TileSuit, value: 5 }, { suit: 'honor' as TileSuit, value: 6 },
        { suit: 'honor' as TileSuit, value: 7 },
    ];

    let hasPair = false;
    for (const r of required) {
        const c = counts[r.suit][r.value - 1];
        if (c === 0) return false;
        if (c === 2) hasPair = true;
    }

    // Total should be 14 tiles
    const total = sum(counts.man) + sum(counts.pin) + sum(counts.sou) + sum(counts.honor);
    return hasPair && total === 14;
}

/** Check if hand is a winning hand (14 tiles including win tile) */
export function isWinningHand(tiles: TileData[], callCount: number = 0): boolean {
    const handTileCount = 14 - callCount * 3;
    if (tiles.length !== handTileCount) return false;

    const counts = countTiles(tiles);

    // Check three forms
    if (checkNormalWin(counts)) return true;
    if (callCount === 0 && isChitoitsu(counts)) return true;
    if (callCount === 0 && isKokushiMusou(counts)) return true;

    return false;
}

/** Get tenpai waits (tiles that would complete the hand) */
export function getTenpaiWaits(tiles: TileData[], callCount: number = 0): { suit: TileSuit, value: number }[] {
    const waits: { suit: TileSuit, value: number }[] = [];
    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    for (const suit of suits) {
        const maxVal = suit === 'honor' ? 7 : 9;
        for (let v = 1; v <= maxVal; v++) {
            const testTiles = [...tiles, { id: 'test', suit, value: v } as TileData];
            if (isWinningHand(testTiles, callCount)) {
                waits.push({ suit, value: v });
            }
        }
    }
    return waits;
}

/** Calculate shanten number (simplified) */
export function calculateShanten(tiles: TileData[], callCount: number = 0): number {
    const counts = countTiles(tiles);

    // Check tenpai first (shanten = 0)
    const waits = getTenpaiWaits(tiles, callCount);
    if (waits.length > 0) return 0;

    // Chitoitsu shanten
    const chitoitsuShanten = calculateChitoitsuShanten(counts);
    // Normal shanten (simplified)
    const normalShanten = calculateNormalShanten(counts, callCount);

    return Math.min(chitoitsuShanten, normalShanten);
}

function calculateChitoitsuShanten(counts: Record<TileSuit, number[]>): number {
    let pairs = 0;
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const c of counts[suit]) {
            if (c >= 2) pairs++;
        }
    }
    return 6 - pairs;
}

function calculateNormalShanten(counts: Record<TileSuit, number[]>, callCount: number): number {
    // Simplified: count mentsu and partial mentsu
    let mentsu = callCount;
    let partial = 0;
    let jantou = false;

    const tempCounts: Record<TileSuit, number[]> = {
        man: [...counts.man], pin: [...counts.pin],
        sou: [...counts.sou], honor: [...counts.honor],
    };

    const suits: TileSuit[] = ['man', 'pin', 'sou', 'honor'];

    // Extract complete mentsu first
    for (const suit of suits) {
        const c = tempCounts[suit];
        // Koutsu
        for (let i = 0; i < c.length; i++) {
            while (c[i] >= 3) { c[i] -= 3; mentsu++; }
        }
        // Shuntsu
        if (suit !== 'honor') {
            for (let i = 0; i < c.length - 2; i++) {
                while (c[i] >= 1 && c[i + 1] >= 1 && c[i + 2] >= 1) {
                    c[i]--; c[i + 1]--; c[i + 2]--; mentsu++;
                }
            }
        }
    }

    // Count pairs and partial mentsu from remainder
    for (const suit of suits) {
        const c = tempCounts[suit];
        for (let i = 0; i < c.length; i++) {
            if (c[i] >= 2 && !jantou) { c[i] -= 2; jantou = true; }
        }
        // Consecutive pairs (partial shuntsu)
        if (suit !== 'honor') {
            for (let i = 0; i < c.length - 1; i++) {
                if (c[i] >= 1 && c[i + 1] >= 1) { c[i]--; c[i + 1]--; partial++; }
            }
        }
        for (let i = 0; i < c.length; i++) {
            if (c[i] >= 2) { c[i] -= 2; partial++; }
        }
    }

    const needed = 4 - callCount;
    const totalMentsuParts = Math.min(mentsu + partial, needed);
    let shanten = (needed - mentsu) * 2 - partial;
    if (!jantou) shanten++;
    if (shanten < 0) shanten = 0;

    return shanten;
}
