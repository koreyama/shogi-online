// Server-side Mahjong Scoring
import { YakuResult } from './yaku';
import { TileData, Wind } from './types';

export interface ScoreResult {
    han: number;
    fu: number;
    baseScore: number;
    totalScore: number;
    yakuList: YakuResult[];
    yakuSummary: string;
    scoreLabel: string;
}

interface CallData {
    callType: string;
    tiles: TileData[];
    fromPlayer: number;
}

/**
 * Calculate score from yaku list
 */
export function calculateScore(
    yakuList: YakuResult[],
    isTsumo: boolean,
    isDealer: boolean,
    honba: number,
    hand: TileData[],
    calls: CallData[],
    winTile: TileData,
): ScoreResult {
    // Check yakuman
    const yakumanList = yakuList.filter(y => y.isYakuman);
    if (yakumanList.length > 0) {
        const baseScore = 8000 * yakumanList.length;
        const totalScore = isDealer
            ? baseScore * 6
            : baseScore * 4;
        return {
            han: 13 * yakumanList.length,
            fu: 0,
            baseScore,
            totalScore: totalScore + honba * 300,
            yakuList,
            yakuSummary: yakuList.map(y => `${y.nameJp}`).join(', '),
            scoreLabel: yakumanList.length > 1 ? 'ダブル役満' : '役満',
        };
    }

    const totalHan = yakuList.reduce((s, y) => s + y.han, 0);
    const fu = calculateFu(hand, calls, winTile, isTsumo);

    let baseScore: number;
    let label: string;

    if (totalHan >= 13) {
        baseScore = 8000;
        label = '数え役満';
    } else if (totalHan >= 11) {
        baseScore = 6000;
        label = '三倍満';
    } else if (totalHan >= 8) {
        baseScore = 4000;
        label = '倍満';
    } else if (totalHan >= 6) {
        baseScore = 3000;
        label = '跳満';
    } else if (totalHan >= 5 || (totalHan === 4 && fu >= 30) || (totalHan === 3 && fu >= 60)) {
        baseScore = 2000;
        label = '満貫';
    } else {
        baseScore = fu * Math.pow(2, totalHan + 2);
        if (baseScore > 2000) { baseScore = 2000; label = '満貫'; }
        else { label = `${totalHan}翻${fu}符`; }
    }

    // Total score
    let totalScore: number;
    if (isTsumo) {
        if (isDealer) {
            totalScore = roundUp100(baseScore * 2) * 3;
        } else {
            totalScore = roundUp100(baseScore * 2) + roundUp100(baseScore) * 2;
        }
    } else {
        // Ron
        if (isDealer) {
            totalScore = roundUp100(baseScore * 6);
        } else {
            totalScore = roundUp100(baseScore * 4);
        }
    }

    totalScore += honba * 300;

    return {
        han: totalHan,
        fu,
        baseScore,
        totalScore,
        yakuList,
        yakuSummary: yakuList.map(y => `${y.nameJp}(${y.han}翻)`).join(', '),
        scoreLabel: label,
    };
}

function roundUp100(n: number): number {
    return Math.ceil(n / 100) * 100;
}

/**
 * Calculate Fu (simplified but reasonable)
 */
function calculateFu(hand: TileData[], calls: CallData[], winTile: TileData, isTsumo: boolean): number {
    let fu = 30; // Base fu for ron, 20 for tsumo pinfu

    // Tsumo bonus
    if (isTsumo) fu += 2;

    // Koutsu in hand
    const counts: Record<string, number> = {};
    for (const t of hand) {
        const key = `${t.suit}-${t.value}`;
        counts[key] = (counts[key] || 0) + 1;
    }

    for (const [key, count] of Object.entries(counts)) {
        if (count >= 3) {
            const parts = key.split('-');
            const value = parseInt(parts[1]);
            const isTerminal = parts[0] === 'honor' || value === 1 || value === 9;
            fu += isTerminal ? 8 : 4; // Ankou: concealed triplet
        }
    }

    // Calls
    for (const c of calls) {
        if (c.callType === 'pon') {
            const t = c.tiles[0];
            const isTerminal = t.suit === 'honor' || t.value === 1 || t.value === 9;
            fu += isTerminal ? 4 : 2; // Minkou: open triplet
        }
        if (c.callType === 'ankan') {
            const t = c.tiles[0];
            const isTerminal = t.suit === 'honor' || t.value === 1 || t.value === 9;
            fu += isTerminal ? 32 : 16;
        }
        if (c.callType === 'kan' || c.callType === 'daiminkan') {
            const t = c.tiles[0];
            const isTerminal = t.suit === 'honor' || t.value === 1 || t.value === 9;
            fu += isTerminal ? 16 : 8;
        }
    }

    return roundUp10(Math.max(fu, 30));
}

function roundUp10(n: number): number {
    return Math.ceil(n / 10) * 10;
}

/**
 * Calculate dora count
 */
export function countDora(hand: TileData[], calls: CallData[], doraIndicators: TileData[], uraDoraIndicators: TileData[], isRiichi: boolean): number {
    let doraCount = 0;
    const allTiles = [...hand];
    calls.forEach(c => allTiles.push(...c.tiles));

    for (const indicator of doraIndicators) {
        const doraValue = getDoraValue(indicator);
        doraCount += allTiles.filter(t => t.suit === doraValue.suit && t.value === doraValue.value).length;
    }

    // Ura dora (only if riichi)
    if (isRiichi) {
        for (const indicator of uraDoraIndicators) {
            const doraValue = getDoraValue(indicator);
            doraCount += allTiles.filter(t => t.suit === doraValue.suit && t.value === doraValue.value).length;
        }
    }

    // Red dora
    doraCount += allTiles.filter(t => t.isRed).length;

    return doraCount;
}

function getDoraValue(indicator: TileData): { suit: string, value: number } {
    if (indicator.suit === 'honor') {
        // wind: 1→2→3→4→1, dragon: 5→6→7→5
        if (indicator.value <= 4) {
            return { suit: 'honor', value: (indicator.value % 4) + 1 };
        } else {
            return { suit: 'honor', value: ((indicator.value - 5 + 1) % 3) + 5 };
        }
    }
    return { suit: indicator.suit, value: (indicator.value % 9) + 1 };
}
