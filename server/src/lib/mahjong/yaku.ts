// Server-side Mahjong Yaku Detection
import { TileData, TileSuit, Wind, HONOR_VALUES } from './types';
import { countTiles } from './hand-evaluator';

export interface YakuResult {
    name: string;
    nameJp: string;
    han: number;
    isYakuman: boolean;
}

interface CallData {
    callType: string;
    tiles: TileData[];
    fromPlayer: number;
}

/**
 * Evaluate all yaku for a winning hand
 */
export function evaluateYaku(
    handTiles: TileData[],
    calls: CallData[],
    winningTile: TileData,
    isTsumo: boolean,
    isRiichi: boolean,
    isIppatsu: boolean,
    isDoubleRiichi: boolean,
    isTenhou: boolean,
    isChihou: boolean,
    isRinshan: boolean,
    isHaitei: boolean,
    isHoutei: boolean,
    isChankan: boolean,
    roundWind: Wind,
    seatWind: Wind,
): YakuResult[] {
    const yakuList: YakuResult[] = [];
    const isMenzen = calls.length === 0 || calls.every(c => c.callType === 'ankan');
    const allTiles = [...handTiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    const counts = countTiles(allTiles);

    // --- Yakuman ---
    if (isTenhou) yakuList.push({ name: 'tenhou', nameJp: '天和', han: 13, isYakuman: true });
    if (isChihou) yakuList.push({ name: 'chihou', nameJp: '地和', han: 13, isYakuman: true });
    if (isKokushiMusou(counts)) yakuList.push({ name: 'kokushi', nameJp: '国士無双', han: 13, isYakuman: true });
    if (isSuuankou(handTiles, calls, isTsumo, winningTile)) yakuList.push({ name: 'suuankou', nameJp: '四暗刻', han: 13, isYakuman: true });
    if (isDaisangen(allTiles, calls)) yakuList.push({ name: 'daisangen', nameJp: '大三元', han: 13, isYakuman: true });
    if (isShousuushi(allTiles, calls)) yakuList.push({ name: 'shousuushi', nameJp: '小四喜', han: 13, isYakuman: true });
    if (isDaisuushi(allTiles, calls)) yakuList.push({ name: 'daisuushi', nameJp: '大四喜', han: 13, isYakuman: true });
    if (isTsuuiisou(allTiles, calls)) yakuList.push({ name: 'tsuuiisou', nameJp: '字一色', han: 13, isYakuman: true });
    if (isChinroutou(allTiles, calls)) yakuList.push({ name: 'chinroutou', nameJp: '清老頭', han: 13, isYakuman: true });
    if (isRyuuiisou(allTiles, calls)) yakuList.push({ name: 'ryuuiisou', nameJp: '緑一色', han: 13, isYakuman: true });
    if (isChuuren(handTiles, calls)) yakuList.push({ name: 'chuuren', nameJp: '九蓮宝燈', han: 13, isYakuman: true });

    if (yakuList.some(y => y.isYakuman)) return yakuList;

    // --- Standard yaku ---
    // Riichi
    if (isRiichi && isMenzen) {
        if (isDoubleRiichi) {
            yakuList.push({ name: 'doubleRiichi', nameJp: 'ダブルリーチ', han: 2, isYakuman: false });
        } else {
            yakuList.push({ name: 'riichi', nameJp: 'リーチ', han: 1, isYakuman: false });
        }
    }
    if (isIppatsu && isRiichi) yakuList.push({ name: 'ippatsu', nameJp: '一発', han: 1, isYakuman: false });

    // Tsumo (menzen only)
    if (isTsumo && isMenzen) yakuList.push({ name: 'menzenTsumo', nameJp: '門前清自摸和', han: 1, isYakuman: false });

    // Tanyao
    if (isTanyao(allTiles, calls)) yakuList.push({ name: 'tanyao', nameJp: '断么九', han: 1, isYakuman: false });

    // Pinfu
    if (isMenzen && isPinfu(handTiles, winningTile, roundWind, seatWind)) {
        yakuList.push({ name: 'pinfu', nameJp: '平和', han: 1, isYakuman: false });
    }

    // Iipeikou
    if (isMenzen) {
        if (isRyanpeikou(handTiles)) {
            yakuList.push({ name: 'ryanpeikou', nameJp: '二盃口', han: 3, isYakuman: false });
        } else if (isIipeikou(handTiles)) {
            yakuList.push({ name: 'iipeikou', nameJp: '一盃口', han: 1, isYakuman: false });
        }
    }

    // Yakuhai (value tiles)
    const windValue = windToValue(seatWind);
    const roundWindValue = windToValue(roundWind);
    if (hasKoutsu(allTiles, calls, 'honor', 5)) yakuList.push({ name: 'haku', nameJp: '白', han: 1, isYakuman: false });
    if (hasKoutsu(allTiles, calls, 'honor', 6)) yakuList.push({ name: 'hatsu', nameJp: '發', han: 1, isYakuman: false });
    if (hasKoutsu(allTiles, calls, 'honor', 7)) yakuList.push({ name: 'chun', nameJp: '中', han: 1, isYakuman: false });
    if (hasKoutsu(allTiles, calls, 'honor', windValue)) yakuList.push({ name: 'seatWind', nameJp: '自風', han: 1, isYakuman: false });
    if (roundWindValue !== windValue && hasKoutsu(allTiles, calls, 'honor', roundWindValue)) {
        yakuList.push({ name: 'roundWind', nameJp: '場風', han: 1, isYakuman: false });
    }

    // Chitoitsu
    if (isMenzen && isChitoitsuHand(counts)) {
        yakuList.push({ name: 'chitoitsu', nameJp: '七対子', han: 2, isYakuman: false });
    }

    // Toitoi
    if (isToitoi(allTiles, calls)) yakuList.push({ name: 'toitoi', nameJp: '対々和', han: 2, isYakuman: false });

    // Sanankou
    if (isSanankou(handTiles, calls, isTsumo, winningTile)) {
        yakuList.push({ name: 'sanankou', nameJp: '三暗刻', han: 2, isYakuman: false });
    }

    // Sanshoku doujun
    const sanshokuHan = isMenzen ? 2 : 1;
    if (isSanshokuDoujun(allTiles, calls)) yakuList.push({ name: 'sanshoku', nameJp: '三色同順', han: sanshokuHan, isYakuman: false });

    // Ittsu
    const ittsuHan = isMenzen ? 2 : 1;
    if (isIttsu(allTiles, calls)) yakuList.push({ name: 'ittsu', nameJp: '一気通貫', han: ittsuHan, isYakuman: false });

    // Chanta
    const chantaHan = isMenzen ? 2 : 1;
    if (isChanta(allTiles, calls)) yakuList.push({ name: 'chanta', nameJp: '混全帯幺九', han: chantaHan, isYakuman: false });

    // Junchan
    const junchanHan = isMenzen ? 3 : 2;
    if (isJunchan(allTiles, calls)) yakuList.push({ name: 'junchan', nameJp: '純全帯幺九', han: junchanHan, isYakuman: false });

    // Honitsu
    const honitsuHan = isMenzen ? 3 : 2;
    if (isHonitsu(allTiles, calls)) yakuList.push({ name: 'honitsu', nameJp: '混一色', han: honitsuHan, isYakuman: false });

    // Chinitsu
    const chinitsuHan = isMenzen ? 6 : 5;
    if (isChinitsu(allTiles, calls)) yakuList.push({ name: 'chinitsu', nameJp: '清一色', han: chinitsuHan, isYakuman: false });

    // Shousangen
    if (isShousangen(allTiles, calls)) yakuList.push({ name: 'shousangen', nameJp: '小三元', han: 2, isYakuman: false });

    // Honroutou
    if (isHonroutou(allTiles, calls)) yakuList.push({ name: 'honroutou', nameJp: '混老頭', han: 2, isYakuman: false });

    // Rinshan/Haitei/Houtei/Chankan
    if (isRinshan) yakuList.push({ name: 'rinshan', nameJp: '嶺上開花', han: 1, isYakuman: false });
    if (isHaitei && isTsumo) yakuList.push({ name: 'haitei', nameJp: '海底摸月', han: 1, isYakuman: false });
    if (isHoutei && !isTsumo) yakuList.push({ name: 'houtei', nameJp: '河底撈魚', han: 1, isYakuman: false });
    if (isChankan) yakuList.push({ name: 'chankan', nameJp: '搶槓', han: 1, isYakuman: false });

    return yakuList;
}

// --- Helper functions ---

function windToValue(wind: Wind): number {
    switch (wind) {
        case 'east': return 1;
        case 'south': return 2;
        case 'west': return 3;
        case 'north': return 4;
    }
}

function isTanyao(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    return allTiles.every(t => {
        if (t.suit === 'honor') return false;
        return t.value >= 2 && t.value <= 8;
    });
}

function hasKoutsu(tiles: TileData[], calls: CallData[], suit: TileSuit, value: number): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    return allTiles.filter(t => t.suit === suit && t.value === value).length >= 3;
}

function isChitoitsuHand(counts: Record<TileSuit, number[]>): boolean {
    let pairs = 0;
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const c of counts[suit]) {
            if (c === 1 || c === 3) return false;
            if (c === 2) pairs++;
        }
    }
    return pairs === 7;
}

function isToitoi(tiles: TileData[], calls: CallData[]): boolean {
    // All mentsu must be koutsu (triplets), no shuntsu (sequences)
    // Check calls first
    for (const c of calls) {
        if (c.callType === 'chi') return false; // Has a sequence call
    }
    // For hand tiles, check if they can form only koutsu + jantou
    const handCounts = countTiles(tiles);
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const c of handCounts[suit]) {
            if (c !== 0 && c !== 2 && c !== 3) return false;
        }
    }
    return true;
}

function isHonitsu(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    const numSuits = new Set<TileSuit>();
    let hasHonor = false;
    for (const t of allTiles) {
        if (t.suit === 'honor') { hasHonor = true; }
        else { numSuits.add(t.suit); }
    }
    return numSuits.size === 1 && hasHonor;
}

function isChinitsu(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    const suits = new Set(allTiles.map(t => t.suit));
    return suits.size === 1 && !suits.has('honor');
}

function isDaisangen(tiles: TileData[], calls: CallData[]): boolean {
    return hasKoutsu(tiles, calls, 'honor', 5) &&
        hasKoutsu(tiles, calls, 'honor', 6) &&
        hasKoutsu(tiles, calls, 'honor', 7);
}

function isShousangen(tiles: TileData[], calls: CallData[]): boolean {
    let koutsuCount = 0;
    let pairCount = 0;
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    for (const v of [5, 6, 7]) {
        const count = allTiles.filter(t => t.suit === 'honor' && t.value === v).length;
        if (count >= 3) koutsuCount++;
        else if (count >= 2) pairCount++;
    }
    return koutsuCount === 2 && pairCount === 1;
}

function isShousuushi(tiles: TileData[], calls: CallData[]): boolean {
    let koutsuCount = 0;
    let pairCount = 0;
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    for (const v of [1, 2, 3, 4]) {
        const count = allTiles.filter(t => t.suit === 'honor' && t.value === v).length;
        if (count >= 3) koutsuCount++;
        else if (count >= 2) pairCount++;
    }
    return koutsuCount === 3 && pairCount === 1;
}

function isDaisuushi(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    for (const v of [1, 2, 3, 4]) {
        if (allTiles.filter(t => t.suit === 'honor' && t.value === v).length < 3) return false;
    }
    return true;
}

function isTsuuiisou(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    return allTiles.every(t => t.suit === 'honor');
}

function isChinroutou(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    return allTiles.every(t => t.suit !== 'honor' && (t.value === 1 || t.value === 9));
}

function isRyuuiisou(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    return allTiles.every(t =>
        (t.suit === 'sou' && [2, 3, 4, 6, 8].includes(t.value)) ||
        (t.suit === 'honor' && t.value === 6) // 發
    );
}

function isChuuren(hand: TileData[], calls: CallData[]): boolean {
    if (calls.length > 0) return false;
    const suits = new Set(hand.map(t => t.suit));
    if (suits.size !== 1 || suits.has('honor')) return false;
    const suit = hand[0].suit;
    const counts = new Array(9).fill(0);
    hand.forEach(t => { if (t.suit === suit) counts[t.value - 1]++; });
    // 1112345678999 + 1 extra
    const required = [3, 1, 1, 1, 1, 1, 1, 1, 3];
    for (let i = 0; i < 9; i++) {
        if (counts[i] < required[i]) return false;
    }
    return true;
}

function isKokushiMusou(counts: Record<TileSuit, number[]>): boolean {
    const required = [
        { suit: 'man' as TileSuit, idx: 0 }, { suit: 'man' as TileSuit, idx: 8 },
        { suit: 'pin' as TileSuit, idx: 0 }, { suit: 'pin' as TileSuit, idx: 8 },
        { suit: 'sou' as TileSuit, idx: 0 }, { suit: 'sou' as TileSuit, idx: 8 },
        { suit: 'honor' as TileSuit, idx: 0 }, { suit: 'honor' as TileSuit, idx: 1 },
        { suit: 'honor' as TileSuit, idx: 2 }, { suit: 'honor' as TileSuit, idx: 3 },
        { suit: 'honor' as TileSuit, idx: 4 }, { suit: 'honor' as TileSuit, idx: 5 },
        { suit: 'honor' as TileSuit, idx: 6 },
    ];
    let hasPair = false;
    for (const r of required) {
        if (counts[r.suit][r.idx] === 0) return false;
        if (counts[r.suit][r.idx] >= 2) hasPair = true;
    }
    return hasPair;
}

function isSuuankou(hand: TileData[], calls: CallData[], isTsumo: boolean, winTile: TileData): boolean {
    if (calls.some(c => c.callType !== 'ankan')) return false;
    const counts = countTiles(hand);
    let koutsuCount = calls.filter(c => c.callType === 'ankan').length;
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (let i = 0; i < counts[suit].length; i++) {
            if (counts[suit][i] >= 3) koutsuCount++;
        }
    }
    return koutsuCount >= 4;
}

function isPinfu(hand: TileData[], winTile: TileData, roundWind: Wind, seatWind: Wind): boolean {
    if (hand.length < 14) return false;
    // All mentsu must be shuntsu, jantou must not be yakuhai, wait must be ryanmen
    const counts = countTiles(hand);
    // Check: no koutsu
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const c of counts[suit]) {
            if (c >= 3) return false;
        }
    }
    // No honor tiles as pair (yakuhai check)
    if (winTile.suit === 'honor') return false;
    // Simplified: return true if no koutsu found
    return true;
}

function isIipeikou(hand: TileData[]): boolean {
    const shuntsu = extractShuntsu(hand);
    // Check for duplicate shuntsu
    for (let i = 0; i < shuntsu.length; i++) {
        for (let j = i + 1; j < shuntsu.length; j++) {
            if (shuntsu[i].suit === shuntsu[j].suit && shuntsu[i].start === shuntsu[j].start) {
                return true;
            }
        }
    }
    return false;
}

function isRyanpeikou(hand: TileData[]): boolean {
    const shuntsu = extractShuntsu(hand);
    let pairs = 0;
    const used = new Array(shuntsu.length).fill(false);
    for (let i = 0; i < shuntsu.length; i++) {
        if (used[i]) continue;
        for (let j = i + 1; j < shuntsu.length; j++) {
            if (used[j]) continue;
            if (shuntsu[i].suit === shuntsu[j].suit && shuntsu[i].start === shuntsu[j].start) {
                used[i] = used[j] = true;
                pairs++;
                break;
            }
        }
    }
    return pairs >= 2;
}

function extractShuntsu(hand: TileData[]): { suit: TileSuit, start: number }[] {
    const result: { suit: TileSuit, start: number }[] = [];
    const counts = countTiles(hand);
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        const c = [...counts[suit]];
        for (let i = 0; i < 7; i++) {
            while (c[i] >= 1 && c[i + 1] >= 1 && c[i + 2] >= 1) {
                c[i]--; c[i + 1]--; c[i + 2]--;
                result.push({ suit, start: i + 1 });
            }
        }
    }
    return result;
}

function isSanshokuDoujun(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.filter(c => c.callType === 'chi').forEach(c => allTiles.push(...c.tiles));
    const shuntsu = extractShuntsu(allTiles);
    // Also check chi calls
    for (const c of calls) {
        if (c.callType === 'chi' && c.tiles.length >= 3) {
            const sorted = [...c.tiles].sort((a, b) => a.value - b.value);
            shuntsu.push({ suit: sorted[0].suit, start: sorted[0].value });
        }
    }
    for (let start = 1; start <= 7; start++) {
        const hasSuits = new Set<TileSuit>();
        for (const s of shuntsu) {
            if (s.start === start && s.suit !== 'honor') hasSuits.add(s.suit);
        }
        if (hasSuits.size >= 3) return true;
    }
    return false;
}

function isIttsu(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    const shuntsu = extractShuntsu(allTiles);
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        const starts = new Set(shuntsu.filter(s => s.suit === suit).map(s => s.start));
        if (starts.has(1) && starts.has(4) && starts.has(7)) return true;
    }
    return false;
}

function isSanankou(hand: TileData[], calls: CallData[], isTsumo: boolean, winTile: TileData): boolean {
    const counts = countTiles(hand);
    let ankou = calls.filter(c => c.callType === 'ankan').length;
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (let i = 0; i < counts[suit].length; i++) {
            if (counts[suit][i] >= 3) ankou++;
        }
    }
    return ankou >= 3;
}

function isChanta(tiles: TileData[], calls: CallData[]): boolean {
    // All mentsu and jantou must contain terminal or honor
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    const hasHonor = allTiles.some(t => t.suit === 'honor');
    if (!hasHonor) return false; // That would be junchan
    // Simplified: check that all tiles are either honor or terminal-adjacent
    return allTiles.every(t =>
        t.suit === 'honor' || t.value === 1 || t.value === 9 ||
        t.value === 2 || t.value === 8 || t.value === 3 || t.value === 7
    );
}

function isJunchan(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    if (allTiles.some(t => t.suit === 'honor')) return false;
    // All mentsu must contain 1 or 9
    return allTiles.every(t =>
        t.value === 1 || t.value === 9 ||
        t.value === 2 || t.value === 8 || t.value === 3 || t.value === 7
    );
}

function isHonroutou(tiles: TileData[], calls: CallData[]): boolean {
    const allTiles = [...tiles];
    calls.forEach(c => allTiles.push(...c.tiles));
    return allTiles.every(t => t.suit === 'honor' || t.value === 1 || t.value === 9);
}
