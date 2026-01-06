// Mahjong Types Definition
// Japanese Riichi Mahjong

// 牌の種類
export type TileSuit = 'man' | 'pin' | 'sou' | 'honor';
// man = 萬子, pin = 筒子, sou = 索子, honor = 字牌

// 字牌の種類
export type HonorType = 'east' | 'south' | 'west' | 'north' | 'white' | 'green' | 'red';
// east=東, south=南, west=西, north=北, white=白, green=發, red=中

export interface Tile {
    id: string;           // 一意のID
    suit: TileSuit;       // 種類
    value: number;        // 数牌は1-9、字牌は1-7
    isRed?: boolean;      // 赤ドラかどうか
}

// プレイヤーの風
export type Wind = 'east' | 'south' | 'west' | 'north';

// 鳴きの種類
export type CallType = 'chi' | 'pon' | 'kan' | 'ankan' | 'kakan';
// chi=チー, pon=ポン, kan=大明槓, ankan=暗槓, kakan=加槓

export interface Call {
    type: CallType;
    tiles: Tile[];
    fromPlayer?: number;  // 誰から鳴いたか（暗槓は不要）
}

// プレイヤーの状態
export interface PlayerState {
    id: string;
    name: string;
    hand: Tile[];         // 手牌（13枚、ツモ時は14枚）
    discards: Tile[];     // 河（捨て牌）
    calls: Call[];        // 鳴き
    score: number;        // 点数
    wind: Wind;           // 自風
    isRiichi: boolean;    // リーチしているか
    riichiTurn?: number;  // リーチした巡目
    isIppatsu: boolean;   // 一発の可能性があるか
}

// ゲームのフェーズ
export type GamePhase =
    | 'waiting'     // 待機中
    | 'dealing'     // 配牌中
    | 'playing'     // プレイ中
    | 'calling'     // 鳴き待ち
    | 'ron'         // ロン宣言待ち
    | 'tsumo'       // ツモ上がり
    | 'draw'        // 流局
    | 'finished';   // 終了

// ゲーム状態
export interface GameState {
    phase: GamePhase;
    players: PlayerState[];
    wall: Tile[];           // 山牌
    deadWall: Tile[];       // 王牌（嶺上牌とドラ）
    doraIndicators: Tile[]; // ドラ表示牌
    uraDoraIndicators: Tile[]; // 裏ドラ表示牌
    currentPlayerIndex: number; // 現在のプレイヤー
    roundWind: Wind;        // 場風（東場/南場）
    roundNumber: number;    // 何局目か（1-4）
    honba: number;          // 本場
    riichiSticks: number;   // 供託リーチ棒
    turnCount: number;      // 巡目
    lastDiscard?: Tile;     // 最後に捨てられた牌
    lastDiscardPlayer?: number; // 最後に捨てたプレイヤー
    canCall: boolean;       // 鳴きが可能か
    canRon: boolean[];      // ロンが可能か（各プレイヤー）
    winner?: number;        // 勝者
    winningHand?: WinningHand; // 上がり情報
}

// 上がり情報
export interface WinningHand {
    player: number;
    tiles: Tile[];
    calls: Call[];
    winningTile: Tile;
    isTsumo: boolean;
    yaku: Yaku[];
    han: number;
    fu: number;
    score: number;
    isYakuman: boolean;
}

// 役
export interface Yaku {
    name: string;
    nameJp: string;
    han: number;      // 翻数（役満は13）
    isYakuman: boolean;
}

// 牌の表示用ヘルパー
export const TILE_DISPLAY: Record<string, string> = {
    // 萬子
    'man1': '🀇', 'man2': '🀈', 'man3': '🀉', 'man4': '🀊', 'man5': '🀋',
    'man6': '🀌', 'man7': '🀍', 'man8': '🀎', 'man9': '🀏',
    // 筒子
    'pin1': '🀙', 'pin2': '🀚', 'pin3': '🀛', 'pin4': '🀜', 'pin5': '🀝',
    'pin6': '🀞', 'pin7': '🀟', 'pin8': '🀠', 'pin9': '🀡',
    // 索子
    'sou1': '🀐', 'sou2': '🀑', 'sou3': '🀒', 'sou4': '🀓', 'sou5': '🀔',
    'sou6': '🀕', 'sou7': '🀖', 'sou8': '🀗', 'sou9': '🀘',
    // 字牌
    'east': '🀀', 'south': '🀁', 'west': '🀂', 'north': '🀃',
    'white': '🀆', 'green': '🀅', 'red': '🀄'
};

// 牌の日本語名
export const TILE_NAMES: Record<string, string> = {
    'man1': '一萬', 'man2': '二萬', 'man3': '三萬', 'man4': '四萬', 'man5': '五萬',
    'man6': '六萬', 'man7': '七萬', 'man8': '八萬', 'man9': '九萬',
    'pin1': '一筒', 'pin2': '二筒', 'pin3': '三筒', 'pin4': '四筒', 'pin5': '五筒',
    'pin6': '六筒', 'pin7': '七筒', 'pin8': '八筒', 'pin9': '九筒',
    'sou1': '一索', 'sou2': '二索', 'sou3': '三索', 'sou4': '四索', 'sou5': '五索',
    'sou6': '六索', 'sou7': '七索', 'sou8': '八索', 'sou9': '九索',
    'east': '東', 'south': '南', 'west': '西', 'north': '北',
    'white': '白', 'green': '發', 'red': '中'
};

// 風の順番
export const WIND_ORDER: Wind[] = ['east', 'south', 'west', 'north'];

// 字牌の値とタイプの対応
export const HONOR_VALUES: Record<number, HonorType> = {
    1: 'east', 2: 'south', 3: 'west', 4: 'north',
    5: 'white', 6: 'green', 7: 'red'
};

// 互換性のあるタイル表示データ取得
export function getTileVisual(suit: string, value: number): { text: string, sub?: string, color: string } {
    if (suit === 'man') {
        return { text: value.toString(), sub: '萬', color: '#b71c1c' }; // Red
    }
    if (suit === 'pin') {
        // Use standard number + Circle implicit in design, or just text representation
        return { text: value.toString(), sub: '筒', color: '#0d47a1' }; // Blue
    }
    if (suit === 'sou') {
        if (value === 1) return { text: '鳥', color: '#1b5e20' }; // 1 Sou (Bird)
        return { text: value.toString(), sub: '索', color: '#1b5e20' }; // Green
    }
    if (suit === 'honor') {
        const map: Record<number, { t: string, c: string }> = {
            1: { t: '東', c: '#000' },
            2: { t: '南', c: '#000' },
            3: { t: '西', c: '#000' },
            4: { t: '北', c: '#000' },
            5: { t: '白', c: '#000' }, // White dragon usually blank or blue frame, use Black for text
            6: { t: '發', c: '#1b5e20' }, // Green Dragon
            7: { t: '中', c: '#b71c1c' }  // Red Dragon
        };
        const h = map[value];
        return { text: h?.t || '?', color: h?.c || '#000' };
    }
    return { text: '?', color: '#000' };
}
