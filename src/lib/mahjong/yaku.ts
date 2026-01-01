// Mahjong Yaku (役) Definitions
// 役の判定と翻数計算

import { Tile, TileSuit, Call, Yaku, Wind, HONOR_VALUES } from './types';
import { countTiles } from './hand-evaluator';

/**
 * 役の定義
 */
export const YAKU_LIST: Record<string, Omit<Yaku, 'han'> & { han: number | { open: number, closed: number } }> = {
    // 1翻
    riichi: { name: 'riichi', nameJp: 'リーチ', han: 1, isYakuman: false },
    ippatsu: { name: 'ippatsu', nameJp: '一発', han: 1, isYakuman: false },
    menzenTsumo: { name: 'menzenTsumo', nameJp: '門前清自摸和', han: 1, isYakuman: false },
    tanyao: { name: 'tanyao', nameJp: '断幺九', han: 1, isYakuman: false },
    pinfu: { name: 'pinfu', nameJp: '平和', han: 1, isYakuman: false },
    iipeikou: { name: 'iipeikou', nameJp: '一盃口', han: 1, isYakuman: false },
    yakuhaiHaku: { name: 'yakuhaiHaku', nameJp: '役牌 白', han: 1, isYakuman: false },
    yakuhaiHatsu: { name: 'yakuhaiHatsu', nameJp: '役牌 發', han: 1, isYakuman: false },
    yakuhaiChun: { name: 'yakuhaiChun', nameJp: '役牌 中', han: 1, isYakuman: false },
    yakuhaiBakaze: { name: 'yakuhaiBakaze', nameJp: '役牌 場風', han: 1, isYakuman: false },
    yakuhaiJikaze: { name: 'yakuhaiJikaze', nameJp: '役牌 自風', han: 1, isYakuman: false },
    rinshan: { name: 'rinshan', nameJp: '嶺上開花', han: 1, isYakuman: false },
    chankan: { name: 'chankan', nameJp: '槍槓', han: 1, isYakuman: false },
    haitei: { name: 'haitei', nameJp: '海底撈月', han: 1, isYakuman: false },
    houtei: { name: 'houtei', nameJp: '河底撈魚', han: 1, isYakuman: false },

    // 2翻
    sanshokuDoujun: { name: 'sanshokuDoujun', nameJp: '三色同順', han: { open: 1, closed: 2 }, isYakuman: false },
    ittsu: { name: 'ittsu', nameJp: '一気通貫', han: { open: 1, closed: 2 }, isYakuman: false },
    chanta: { name: 'chanta', nameJp: '混全帯幺九', han: { open: 1, closed: 2 }, isYakuman: false },
    chitoitsu: { name: 'chitoitsu', nameJp: '七対子', han: 2, isYakuman: false },
    toitoi: { name: 'toitoi', nameJp: '対々和', han: 2, isYakuman: false },
    sanankou: { name: 'sanankou', nameJp: '三暗刻', han: 2, isYakuman: false },
    honroutou: { name: 'honroutou', nameJp: '混老頭', han: 2, isYakuman: false },
    sanshokuDoukou: { name: 'sanshokuDoukou', nameJp: '三色同刻', han: 2, isYakuman: false },
    sankantsu: { name: 'sankantsu', nameJp: '三槓子', han: 2, isYakuman: false },
    shousangen: { name: 'shousangen', nameJp: '小三元', han: 2, isYakuman: false },
    doubleRiichi: { name: 'doubleRiichi', nameJp: 'ダブル立直', han: 2, isYakuman: false },

    // 3翻
    honitsu: { name: 'honitsu', nameJp: '混一色', han: { open: 2, closed: 3 }, isYakuman: false },
    junchan: { name: 'junchan', nameJp: '純全帯幺九', han: { open: 2, closed: 3 }, isYakuman: false },
    ryanpeikou: { name: 'ryanpeikou', nameJp: '二盃口', han: 3, isYakuman: false },

    // 6翻
    chinitsu: { name: 'chinitsu', nameJp: '清一色', han: { open: 5, closed: 6 }, isYakuman: false },

    // 役満
    kokushiMusou: { name: 'kokushiMusou', nameJp: '国士無双', han: 13, isYakuman: true },
    suuankou: { name: 'suuankou', nameJp: '四暗刻', han: 13, isYakuman: true },
    daisangen: { name: 'daisangen', nameJp: '大三元', han: 13, isYakuman: true },
    shousuushi: { name: 'shousuushi', nameJp: '小四喜', han: 13, isYakuman: true },
    daisuushi: { name: 'daisuushi', nameJp: '大四喜', han: 13, isYakuman: true },
    tsuuiisou: { name: 'tsuuiisou', nameJp: '字一色', han: 13, isYakuman: true },
    chinroutou: { name: 'chinroutou', nameJp: '清老頭', han: 13, isYakuman: true },
    ryuuiisou: { name: 'ryuuiisou', nameJp: '緑一色', han: 13, isYakuman: true },
    chuurenPoutou: { name: 'chuurenPoutou', nameJp: '九蓮宝燈', han: 13, isYakuman: true },
    suukantsu: { name: 'suukantsu', nameJp: '四槓子', han: 13, isYakuman: true },
    tenhou: { name: 'tenhou', nameJp: '天和', han: 13, isYakuman: true },
    chihou: { name: 'chihou', nameJp: '地和', han: 13, isYakuman: true },
};

/**
 * 手牌の役を判定する
 */
export function evaluateYaku(
    tiles: Tile[],
    calls: Call[],
    winningTile: Tile,
    isTsumo: boolean,
    isRiichi: boolean,
    isIppatsu: boolean,
    isRinshan: boolean,
    isHaitei: boolean,
    isHoutei: boolean,
    isChankan: boolean,
    isDoubleRiichi: boolean,
    isTenhou: boolean,
    isChihou: boolean,
    roundWind: Wind,
    seatWind: Wind,
    doraCount: number
): Yaku[] {
    const yakuList: Yaku[] = [];
    const isMenzen = calls.filter(c => c.type !== 'ankan').length === 0;
    const counts = countTiles(tiles);
    const allTiles = [...tiles];

    // 条件役
    if (isRiichi) yakuList.push({ ...YAKU_LIST.riichi, han: 1 });
    if (isIppatsu && isRiichi) yakuList.push({ ...YAKU_LIST.ippatsu, han: 1 });
    if (isDoubleRiichi) yakuList.push({ ...YAKU_LIST.doubleRiichi, han: 2 });
    if (isTsumo && isMenzen) yakuList.push({ ...YAKU_LIST.menzenTsumo, han: 1 });
    if (isRinshan) yakuList.push({ ...YAKU_LIST.rinshan, han: 1 });
    if (isHaitei && isTsumo) yakuList.push({ ...YAKU_LIST.haitei, han: 1 });
    if (isHoutei && !isTsumo) yakuList.push({ ...YAKU_LIST.houtei, han: 1 });
    if (isChankan) yakuList.push({ ...YAKU_LIST.chankan, han: 1 });
    if (isTenhou) yakuList.push({ ...YAKU_LIST.tenhou, han: 13 });
    if (isChihou) yakuList.push({ ...YAKU_LIST.chihou, han: 13 });

    // タンヤオ
    if (isTanyao(allTiles, calls)) {
        yakuList.push({ ...YAKU_LIST.tanyao, han: 1 });
    }

    // 役牌（三元牌）
    const sangenCounts = [counts.honor[4], counts.honor[5], counts.honor[6]]; // 白發中
    if (hasKoutsuInHandOrCalls(allTiles, calls, 'honor', 5)) { // 白
        yakuList.push({ ...YAKU_LIST.yakuhaiHaku, han: 1 });
    }
    if (hasKoutsuInHandOrCalls(allTiles, calls, 'honor', 6)) { // 發
        yakuList.push({ ...YAKU_LIST.yakuhaiHatsu, han: 1 });
    }
    if (hasKoutsuInHandOrCalls(allTiles, calls, 'honor', 7)) { // 中
        yakuList.push({ ...YAKU_LIST.yakuhaiChun, han: 1 });
    }

    // 場風・自風
    const roundWindValue = windToValue(roundWind);
    const seatWindValue = windToValue(seatWind);
    if (hasKoutsuInHandOrCalls(allTiles, calls, 'honor', roundWindValue)) {
        yakuList.push({ ...YAKU_LIST.yakuhaiBakaze, han: 1 });
    }
    if (hasKoutsuInHandOrCalls(allTiles, calls, 'honor', seatWindValue) && seatWindValue !== roundWindValue) {
        yakuList.push({ ...YAKU_LIST.yakuhaiJikaze, han: 1 });
    }

    // 七対子
    if (isChitoitsuHand(counts)) {
        yakuList.push({ ...YAKU_LIST.chitoitsu, han: 2 });
    }

    // 対々和
    if (isToitoi(allTiles, calls)) {
        yakuList.push({ ...YAKU_LIST.toitoi, han: 2 });
    }

    // 混一色
    if (isHonitsu(allTiles, calls)) {
        const han = typeof YAKU_LIST.honitsu.han === 'number'
            ? YAKU_LIST.honitsu.han
            : (isMenzen ? YAKU_LIST.honitsu.han.closed : YAKU_LIST.honitsu.han.open);
        yakuList.push({ ...YAKU_LIST.honitsu, han });
    }

    // 清一色
    if (isChinitsu(allTiles, calls)) {
        const han = typeof YAKU_LIST.chinitsu.han === 'number'
            ? YAKU_LIST.chinitsu.han
            : (isMenzen ? YAKU_LIST.chinitsu.han.closed : YAKU_LIST.chinitsu.han.open);
        yakuList.push({ ...YAKU_LIST.chinitsu, han });
    }

    // 大三元
    if (isDaisangen(allTiles, calls)) {
        yakuList.push({ ...YAKU_LIST.daisangen, han: 13 });
    }

    // 小三元
    if (isShousangen(allTiles, calls)) {
        yakuList.push({ ...YAKU_LIST.shousangen, han: 2 });
    }

    // 国士無双
    if (isKokushiMusouYaku(counts)) {
        yakuList.push({ ...YAKU_LIST.kokushiMusou, han: 13 });
    }

    // 字一色
    if (isTsuuiisou(allTiles, calls)) {
        yakuList.push({ ...YAKU_LIST.tsuuiisou, han: 13 });
    }

    // 平和（ピンフ）- 門前のみ
    if (isMenzen && isPinfu(allTiles, winningTile, roundWind, seatWind)) {
        yakuList.push({ ...YAKU_LIST.pinfu, han: 1 });
    }

    // 一盃口 - 門前のみ
    if (isMenzen && isIipeikou(allTiles) && !isChitoitsuHand(counts)) {
        yakuList.push({ ...YAKU_LIST.iipeikou, han: 1 });
    }

    // 二盃口 - 門前のみ
    if (isMenzen && isRyanpeikou(allTiles)) {
        yakuList.push({ ...YAKU_LIST.ryanpeikou, han: 3 });
    }

    // 三色同順
    if (isSanshokuDoujun(allTiles, calls)) {
        const han = typeof YAKU_LIST.sanshokuDoujun.han === 'number'
            ? YAKU_LIST.sanshokuDoujun.han
            : (isMenzen ? YAKU_LIST.sanshokuDoujun.han.closed : YAKU_LIST.sanshokuDoujun.han.open);
        yakuList.push({ ...YAKU_LIST.sanshokuDoujun, han });
    }

    // 一気通貫
    if (isIttsu(allTiles, calls)) {
        const han = typeof YAKU_LIST.ittsu.han === 'number'
            ? YAKU_LIST.ittsu.han
            : (isMenzen ? YAKU_LIST.ittsu.han.closed : YAKU_LIST.ittsu.han.open);
        yakuList.push({ ...YAKU_LIST.ittsu, han });
    }

    // 三暗刻
    if (isSanankou(allTiles, calls, isTsumo, winningTile)) {
        yakuList.push({ ...YAKU_LIST.sanankou, han: 2 });
    }

    // 四暗刻
    if (isSuuankou(allTiles, calls, isTsumo, winningTile)) {
        yakuList.push({ ...YAKU_LIST.suuankou, han: 13 });
    }

    // チャンタ
    if (isChanta(allTiles, calls)) {
        const han = typeof YAKU_LIST.chanta.han === 'number'
            ? YAKU_LIST.chanta.han
            : (isMenzen ? YAKU_LIST.chanta.han.closed : YAKU_LIST.chanta.han.open);
        yakuList.push({ ...YAKU_LIST.chanta, han });
    }

    // 純チャン
    if (isJunchan(allTiles, calls)) {
        const han = typeof YAKU_LIST.junchan.han === 'number'
            ? YAKU_LIST.junchan.han
            : (isMenzen ? YAKU_LIST.junchan.han.closed : YAKU_LIST.junchan.han.open);
        yakuList.push({ ...YAKU_LIST.junchan, han });
    }

    return yakuList;
}

// ヘルパー関数

function windToValue(wind: Wind): number {
    const map: Record<Wind, number> = { east: 1, south: 2, west: 3, north: 4 };
    return map[wind];
}

function isTanyao(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];
    return allTiles.every(t => {
        if (t.suit === 'honor') return false;
        return t.value >= 2 && t.value <= 8;
    });
}

function hasKoutsuInHandOrCalls(tiles: Tile[], calls: Call[], suit: TileSuit, value: number): boolean {
    // 鳴きでポン/カンがあるか
    for (const call of calls) {
        if ((call.type === 'pon' || call.type === 'kan' || call.type === 'ankan') &&
            call.tiles[0].suit === suit && call.tiles[0].value === value) {
            return true;
        }
    }
    // 手牌に3枚以上あるか
    const count = tiles.filter(t => t.suit === suit && t.value === value).length;
    return count >= 3;
}

function isChitoitsuHand(counts: Record<TileSuit, number[]>): boolean {
    let pairs = 0;
    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const count of counts[suit]) {
            if (count === 2) pairs++;
            else if (count !== 0) return false;
        }
    }
    return pairs === 7;
}

function isToitoi(tiles: Tile[], calls: Call[]): boolean {
    // 全て刻子（ポン/カン）と雀頭
    const ponKanCount = calls.filter(c =>
        c.type === 'pon' || c.type === 'kan' || c.type === 'ankan'
    ).length;

    // 手牌も刻子のみかチェック
    const counts = countTiles(tiles);
    let koutsuCount = 0;
    let pairCount = 0;

    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (const count of counts[suit]) {
            if (count === 3) koutsuCount++;
            else if (count === 2) pairCount++;
            else if (count !== 0) return false;
        }
    }

    return ponKanCount + koutsuCount === 4 && pairCount === 1;
}

function isHonitsu(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];
    const suits = new Set<TileSuit>();
    let hasHonor = false;

    for (const t of allTiles) {
        if (t.suit === 'honor') hasHonor = true;
        else suits.add(t.suit);
    }

    return suits.size === 1 && hasHonor;
}

function isChinitsu(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];
    const suits = new Set<TileSuit>();

    for (const t of allTiles) {
        suits.add(t.suit);
    }

    return suits.size === 1 && !suits.has('honor');
}

function isDaisangen(tiles: Tile[], calls: Call[]): boolean {
    // 白發中の刻子が全てある
    return hasKoutsuInHandOrCalls(tiles, calls, 'honor', 5) &&
        hasKoutsuInHandOrCalls(tiles, calls, 'honor', 6) &&
        hasKoutsuInHandOrCalls(tiles, calls, 'honor', 7);
}

function isShousangen(tiles: Tile[], calls: Call[]): boolean {
    // 三元牌のうち2つが刻子、1つが対子
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];
    let koutsuCount = 0;
    let pairCount = 0;

    for (let v = 5; v <= 7; v++) {
        if (hasKoutsuInHandOrCalls(tiles, calls, 'honor', v)) {
            koutsuCount++;
        } else {
            const count = allTiles.filter(t => t.suit === 'honor' && t.value === v).length;
            if (count === 2) pairCount++;
        }
    }

    return koutsuCount === 2 && pairCount === 1;
}

function isKokushiMusouYaku(counts: Record<TileSuit, number[]>): boolean {
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
        if (count >= 2) hasPair = true;
    }
    return hasPair;
}

function isTsuuiisou(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];
    return allTiles.every(t => t.suit === 'honor');
}

// 平和判定（簡易版）
function isPinfu(tiles: Tile[], winningTile: Tile, roundWind: Wind, seatWind: Wind): boolean {
    // 条件: 4面子が全て順子、雀頭が役牌でない、両面待ち
    // 簡易版: 字牌がなく、対子が1つで残りが順子になれば平和の可能性あり
    const counts = countTiles(tiles);

    // 字牌があったら不成立
    if (counts.honor.some(c => c > 0)) return false;

    // TODO: 完全な平和判定は複雑なので、簡易判定
    // 刻子がなければ平和の可能性あり
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        for (const count of counts[suit]) {
            if (count >= 3) return false; // 刻子がある
        }
    }

    return true;
}

// 一盃口判定
function isIipeikou(tiles: Tile[]): boolean {
    // 同じ順子が2組ある
    const shuntsuList = extractAllShuntsu(tiles);
    const seen = new Map<string, number>();

    for (const s of shuntsuList) {
        const key = `${s.suit}-${s.start}`;
        seen.set(key, (seen.get(key) || 0) + 1);
    }

    let pairs = 0;
    for (const count of seen.values()) {
        if (count >= 2) pairs++;
    }

    return pairs === 1;
}

// 二盃口判定
function isRyanpeikou(tiles: Tile[]): boolean {
    const shuntsuList = extractAllShuntsu(tiles);
    const seen = new Map<string, number>();

    for (const s of shuntsuList) {
        const key = `${s.suit}-${s.start}`;
        seen.set(key, (seen.get(key) || 0) + 1);
    }

    let pairs = 0;
    for (const count of seen.values()) {
        if (count >= 2) pairs++;
    }

    return pairs >= 2;
}

// 順子を抽出するヘルパー
function extractAllShuntsu(tiles: Tile[]): { suit: TileSuit, start: number }[] {
    const result: { suit: TileSuit, start: number }[] = [];
    const counts = countTiles(tiles);

    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        const arr = [...counts[suit]];
        for (let i = 0; i < 7; i++) {
            while (arr[i] >= 1 && arr[i + 1] >= 1 && arr[i + 2] >= 1) {
                arr[i]--;
                arr[i + 1]--;
                arr[i + 2]--;
                result.push({ suit, start: i + 1 });
            }
        }
    }

    return result;
}

// 三色同順判定
function isSanshokuDoujun(tiles: Tile[], calls: Call[]): boolean {
    // 萬子、筒子、索子で同じ数字の順子がある
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];
    const shuntsuByValue = new Map<number, Set<TileSuit>>();

    // 手牌から順子を抽出
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        const counts = countTiles(allTiles.filter(t => t.suit === suit));
        const arr = [...counts[suit]];
        for (let i = 0; i < 7; i++) {
            if (arr[i] >= 1 && arr[i + 1] >= 1 && arr[i + 2] >= 1) {
                const start = i + 1;
                if (!shuntsuByValue.has(start)) shuntsuByValue.set(start, new Set());
                shuntsuByValue.get(start)!.add(suit);
            }
        }
    }

    // チーからも抽出
    for (const call of calls) {
        if (call.type === 'chi') {
            const sorted = [...call.tiles].sort((a, b) => a.value - b.value);
            const start = sorted[0].value;
            const suit = sorted[0].suit;
            if (suit !== 'honor') {
                if (!shuntsuByValue.has(start)) shuntsuByValue.set(start, new Set());
                shuntsuByValue.get(start)!.add(suit);
            }
        }
    }

    // 3色揃っている開始値があるか
    for (const suits of shuntsuByValue.values()) {
        if (suits.has('man') && suits.has('pin') && suits.has('sou')) {
            return true;
        }
    }

    return false;
}

// 一気通貫判定
function isIttsu(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];

    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
        const suitTiles = allTiles.filter(t => t.suit === suit);
        const counts = countTiles(suitTiles);
        const arr = counts[suit];

        // 123, 456, 789 があるか
        const has123 = arr[0] >= 1 && arr[1] >= 1 && arr[2] >= 1;
        const has456 = arr[3] >= 1 && arr[4] >= 1 && arr[5] >= 1;
        const has789 = arr[6] >= 1 && arr[7] >= 1 && arr[8] >= 1;

        if (has123 && has456 && has789) return true;
    }

    return false;
}

// 三暗刻判定
function isSanankou(tiles: Tile[], calls: Call[], isTsumo: boolean, winningTile: Tile): boolean {
    let ankoCount = 0;
    const counts = countTiles(tiles);

    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (let i = 0; i < counts[suit].length; i++) {
            if (counts[suit][i] >= 3) {
                ankoCount++;
            }
        }
    }

    // 暗槓もカウント
    for (const call of calls) {
        if (call.type === 'ankan') ankoCount++;
    }

    return ankoCount >= 3;
}

// 四暗刻判定
function isSuuankou(tiles: Tile[], calls: Call[], isTsumo: boolean, winningTile: Tile): boolean {
    // ツモのみ成立
    if (!isTsumo) return false;

    let ankoCount = 0;
    const counts = countTiles(tiles);

    for (const suit of ['man', 'pin', 'sou', 'honor'] as TileSuit[]) {
        for (let i = 0; i < counts[suit].length; i++) {
            if (counts[suit][i] >= 3) {
                ankoCount++;
            }
        }
    }

    for (const call of calls) {
        if (call.type === 'ankan') ankoCount++;
    }

    return ankoCount >= 4;
}

// チャンタ判定（全ての面子と雀頭に幺九牌を含む）
function isChanta(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];

    // 字牌が必要
    const hasHonor = allTiles.some(t => t.suit === 'honor');
    if (!hasHonor) return false;

    // 全ての牌が1,9,字牌を含むグループに属しているか（簡易判定）
    // 2-8のみの牌があれば不成立
    const midOnly = allTiles.filter(t =>
        t.suit !== 'honor' && t.value >= 2 && t.value <= 8
    );

    // 中張牌が一定数あれば順子の一部として許容
    // 簡易判定: 幺九牌が半分以上あればOK
    const yaochuCount = allTiles.filter(t =>
        t.suit === 'honor' || t.value === 1 || t.value === 9
    ).length;

    return yaochuCount >= 7; // 14枚中7枚以上が幺九牌
}

// 純チャン判定
function isJunchan(tiles: Tile[], calls: Call[]): boolean {
    const allTiles = [...tiles, ...calls.flatMap(c => c.tiles)];

    // 字牌があれば不成立
    if (allTiles.some(t => t.suit === 'honor')) return false;

    // 全ての牌が1,9を含むグループに属しているか
    const terminalCount = allTiles.filter(t => t.value === 1 || t.value === 9).length;

    return terminalCount >= 6; // 14枚中6枚以上が老頭牌
}

