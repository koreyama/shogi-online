// Mahjong Tile Generation and Management
import { Tile, TileSuit, HonorType, HONOR_VALUES } from './types';

/**
 * 全136枚の牌を生成する
 * 数牌（萬子、筒子、索子）各36枚 + 字牌28枚 = 136枚
 * 各種4枚ずつ、5萬・5筒・5索には赤ドラが1枚ずつ
 */
export function createAllTiles(): Tile[] {
    const tiles: Tile[] = [];
    let idCounter = 0;

    // 数牌を生成（萬子、筒子、索子）
    const suits: TileSuit[] = ['man', 'pin', 'sou'];
    for (const suit of suits) {
        for (let value = 1; value <= 9; value++) {
            for (let copy = 0; copy < 4; copy++) {
                // 5の牌の1枚目は赤ドラ
                const isRed = value === 5 && copy === 0;
                tiles.push({
                    id: `${suit}${value}-${idCounter++}`,
                    suit,
                    value,
                    isRed
                });
            }
        }
    }

    // 字牌を生成（東南西北白發中）
    for (let value = 1; value <= 7; value++) {
        for (let copy = 0; copy < 4; copy++) {
            tiles.push({
                id: `honor${value}-${idCounter++}`,
                suit: 'honor',
                value
            });
        }
    }

    return tiles;
}

/**
 * 配列をシャッフルする（Fisher-Yates）
 */
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 牌を初期化してシャッフルする
 */
export function createShuffledWall(): Tile[] {
    return shuffle(createAllTiles());
}

/**
 * 王牌を分離する（14枚）
 * 嶺上牌4枚 + ドラ表示5枚 + 裏ドラ5枚 = 14枚
 */
export function separateDeadWall(wall: Tile[]): { wall: Tile[], deadWall: Tile[] } {
    const deadWall = wall.slice(-14);
    const remainingWall = wall.slice(0, -14);
    return { wall: remainingWall, deadWall };
}

/**
 * 配牌を行う（各プレイヤー13枚）
 */
export function dealInitialHands(wall: Tile[]): { hands: Tile[][], remainingWall: Tile[] } {
    const hands: Tile[][] = [[], [], [], []];
    let currentIndex = 0;

    // 4人に13枚ずつ配る
    for (let round = 0; round < 13; round++) {
        for (let player = 0; player < 4; player++) {
            hands[player].push(wall[currentIndex++]);
        }
    }

    const remainingWall = wall.slice(currentIndex);

    // 手牌をソート
    for (let i = 0; i < 4; i++) {
        hands[i] = sortHand(hands[i]);
    }

    return { hands, remainingWall };
}

/**
 * 手牌をソートする
 */
export function sortHand(hand: Tile[]): Tile[] {
    const suitOrder: Record<TileSuit, number> = {
        'man': 0,
        'pin': 1,
        'sou': 2,
        'honor': 3
    };

    return [...hand].sort((a, b) => {
        if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }
        return a.value - b.value;
    });
}

/**
 * 牌をツモる（山から1枚引く）
 */
export function drawTile(wall: Tile[]): { tile: Tile | null, remainingWall: Tile[] } {
    if (wall.length === 0) {
        return { tile: null, remainingWall: [] };
    }
    const tile = wall[0];
    const remainingWall = wall.slice(1);
    return { tile, remainingWall };
}

/**
 * 嶺上牌をツモる
 */
export function drawFromDeadWall(deadWall: Tile[]): { tile: Tile | null, remainingDeadWall: Tile[] } {
    if (deadWall.length === 0) {
        return { tile: null, remainingDeadWall: [] };
    }
    const tile = deadWall[0];
    const remainingDeadWall = deadWall.slice(1);
    return { tile, remainingDeadWall };
}

/**
 * ドラ表示牌を取得
 */
export function getDoraIndicators(deadWall: Tile[], kanCount: number = 0): Tile[] {
    // 通常ドラ表示牌は王牌の5枚目（インデックス4）
    // 槓ごとに1枚追加で表示
    const indicators: Tile[] = [];
    const baseIndex = 4;

    for (let i = 0; i <= kanCount && i < 5; i++) {
        if (deadWall[baseIndex + i]) {
            indicators.push(deadWall[baseIndex + i]);
        }
    }

    return indicators;
}

/**
 * ドラ表示牌から実際のドラ牌を計算
 */
export function getDoraFromIndicator(indicator: Tile): { suit: TileSuit, value: number } {
    if (indicator.suit === 'honor') {
        // 字牌のドラ
        // 東→南→西→北→東、白→發→中→白
        if (indicator.value <= 4) {
            // 風牌
            return { suit: 'honor', value: (indicator.value % 4) + 1 };
        } else {
            // 三元牌
            const sangenOrder = [5, 6, 7]; // 白發中
            const currentIndex = indicator.value - 5;
            const nextIndex = (currentIndex + 1) % 3;
            return { suit: 'honor', value: sangenOrder[nextIndex] };
        }
    } else {
        // 数牌のドラ
        const nextValue = indicator.value === 9 ? 1 : indicator.value + 1;
        return { suit: indicator.suit, value: nextValue };
    }
}

/**
 * 牌が同じかどうか判定（IDを除く）
 */
export function isSameTile(a: Tile, b: Tile): boolean {
    return a.suit === b.suit && a.value === b.value;
}

/**
 * 牌の表示用キーを取得
 */
export function getTileKey(tile: Tile): string {
    if (tile.suit === 'honor') {
        return HONOR_VALUES[tile.value] as string;
    }
    return `${tile.suit}${tile.value}`;
}

/**
 * 手牌から特定の牌を除去
 */
export function removeTileFromHand(hand: Tile[], tileId: string): Tile[] {
    const index = hand.findIndex(t => t.id === tileId);
    if (index === -1) return hand;
    return [...hand.slice(0, index), ...hand.slice(index + 1)];
}

/**
 * 牌を手牌に追加してソート
 */
export function addTileToHand(hand: Tile[], tile: Tile): Tile[] {
    return sortHand([...hand, tile]);
}

/**
 * ドラ枚数をカウントする
 * @param tiles 対象の牌（手牌+鳴き牌）
 * @param doraIndicators ドラ表示牌
 * @param uraDoraIndicators 裏ドラ表示牌（リーチ時のみ）
 * @param includeRed 赤ドラを含めるか
 */
export function countDora(
    tiles: Tile[],
    doraIndicators: Tile[],
    uraDoraIndicators: Tile[] = [],
    includeRed: boolean = true
): number {
    let count = 0;

    // 表ドラ
    for (const indicator of doraIndicators) {
        const dora = getDoraFromIndicator(indicator);
        for (const tile of tiles) {
            if (tile.suit === dora.suit && tile.value === dora.value) {
                count++;
            }
        }
    }

    // 裏ドラ
    for (const indicator of uraDoraIndicators) {
        const dora = getDoraFromIndicator(indicator);
        for (const tile of tiles) {
            if (tile.suit === dora.suit && tile.value === dora.value) {
                count++;
            }
        }
    }

    // 赤ドラ
    if (includeRed) {
        for (const tile of tiles) {
            if (tile.isRed) {
                count++;
            }
        }
    }

    return count;
}

/**
 * 裏ドラ表示牌を取得
 */
export function getUraDoraIndicators(deadWall: Tile[], kanCount: number = 0): Tile[] {
    const indicators: Tile[] = [];
    const baseIndex = 9; // 裏ドラは王牌の10枚目から

    for (let i = 0; i <= kanCount && i < 5; i++) {
        if (deadWall[baseIndex + i]) {
            indicators.push(deadWall[baseIndex + i]);
        }
    }

    return indicators;
}
