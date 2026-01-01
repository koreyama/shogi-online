// Mahjong Game Engine
// ゲームフロー管理

import {
    GameState, PlayerState, Tile, Wind, Call, CallType,
    GamePhase, WinningHand, WIND_ORDER
} from './types';
import {
    createShuffledWall, separateDeadWall, dealInitialHands,
    drawTile, sortHand, removeTileFromHand, addTileToHand,
    getDoraIndicators, isSameTile
} from './tiles';
import { isWinningHand, getTenpaiWaits, countTiles } from './hand-evaluator';
import { evaluateYaku } from './yaku';
import { calculateScore, calculateTotalHan, calculateFu } from './scoring';

/**
 * 初期ゲーム状態を作成
 */
export function createInitialGameState(playerNames: string[]): GameState {
    // 山牌を作成
    const shuffledWall = createShuffledWall();
    const { wall, deadWall } = separateDeadWall(shuffledWall);

    // 配牌
    const { hands, remainingWall } = dealInitialHands(wall);

    // プレイヤー初期化
    const players: PlayerState[] = playerNames.map((name, i) => ({
        id: `player-${i}`,
        name,
        hand: hands[i],
        discards: [],
        calls: [],
        score: 25000, // 25000点持ち
        wind: WIND_ORDER[i],
        isRiichi: false,
        isIppatsu: false
    }));

    // ドラ表示牌
    const doraIndicators = getDoraIndicators(deadWall, 0);

    return {
        phase: 'playing',
        players,
        wall: remainingWall,
        deadWall,
        doraIndicators,
        uraDoraIndicators: [],
        currentPlayerIndex: 0, // 東家から開始
        roundWind: 'east',
        roundNumber: 1,
        honba: 0,
        riichiSticks: 0,
        turnCount: 0,
        canCall: false,
        canRon: [false, false, false, false]
    };
}

/**
 * ツモを行う
 */
export function performDraw(state: GameState): GameState {
    const { tile, remainingWall } = drawTile(state.wall);

    if (!tile) {
        // 流局
        return {
            ...state,
            phase: 'draw',
            wall: remainingWall
        };
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    const newHand = [...currentPlayer.hand, tile]; // ツモ牌は末尾に追加（ソートしない）

    const newPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex
            ? { ...p, hand: newHand }
            : p
    );

    // ツモ上がりチェック
    const canTsumo = isWinningHand(newHand, currentPlayer.calls);

    return {
        ...state,
        players: newPlayers,
        wall: remainingWall,
        phase: canTsumo ? 'tsumo' : 'playing',
        turnCount: state.turnCount + 1
    };
}

/**
 * 打牌を行う
 */
export function performDiscard(state: GameState, tileId: string): GameState {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const discardedTile = currentPlayer.hand.find(t => t.id === tileId);

    if (!discardedTile) return state;

    const newHand = removeTileFromHand(currentPlayer.hand, tileId);
    const sortedHand = sortHand(newHand);

    const newPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex
            ? {
                ...p,
                hand: sortedHand,
                discards: [...p.discards, discardedTile],
                isIppatsu: false // 打牌したら一発消滅
            }
            : { ...p, isIppatsu: false } // 他家の一発も消滅
    );

    // 鳴き・ロンのチェック
    const canCallPlayers = checkCallOpportunities(state, discardedTile);
    const canRonPlayers = checkRonOpportunities(state, discardedTile);

    const hasAnyOpportunity = canCallPlayers.some(c => c) || canRonPlayers.some(r => r);

    if (hasAnyOpportunity) {
        return {
            ...state,
            players: newPlayers,
            lastDiscard: discardedTile,
            lastDiscardPlayer: state.currentPlayerIndex,
            phase: 'calling',
            canCall: canCallPlayers.some(c => c),
            canRon: canRonPlayers
        };
    }

    // 次のプレイヤーへ
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % 4;

    return {
        ...state,
        players: newPlayers,
        lastDiscard: discardedTile,
        lastDiscardPlayer: state.currentPlayerIndex,
        currentPlayerIndex: nextPlayerIndex,
        phase: 'playing',
        canCall: false,
        canRon: [false, false, false, false]
    };
}

/**
 * 鳴きの機会をチェック
 */
function checkCallOpportunities(state: GameState, discardedTile: Tile): boolean[] {
    const result = [false, false, false, false];
    const discardPlayerIndex = state.currentPlayerIndex;

    for (let i = 0; i < 4; i++) {
        if (i === discardPlayerIndex) continue;

        const player = state.players[i];

        // ポンチェック
        if (canPon(player.hand, discardedTile)) {
            result[i] = true;
        }

        // チーチェック（下家のみ）
        if (i === (discardPlayerIndex + 1) % 4 && canChi(player.hand, discardedTile)) {
            result[i] = true;
        }

        // カンチェック
        if (canDaiminkan(player.hand, discardedTile)) {
            result[i] = true;
        }
    }

    return result;
}

/**
 * ロンの機会をチェック
 */
function checkRonOpportunities(state: GameState, discardedTile: Tile): boolean[] {
    const result = [false, false, false, false];
    const discardPlayerIndex = state.currentPlayerIndex;

    for (let i = 0; i < 4; i++) {
        if (i === discardPlayerIndex) continue;

        const player = state.players[i];
        const testHand = [...player.hand, discardedTile];

        if (isWinningHand(testHand, player.calls)) {
            result[i] = true;
        }
    }

    return result;
}

/**
 * ポンできるかチェック
 */
function canPon(hand: Tile[], discardedTile: Tile): boolean {
    const matchingTiles = hand.filter(t =>
        t.suit === discardedTile.suit && t.value === discardedTile.value
    );
    return matchingTiles.length >= 2;
}

/**
 * チーできるかチェック
 */
function canChi(hand: Tile[], discardedTile: Tile): boolean {
    if (discardedTile.suit === 'honor') return false;

    const v = discardedTile.value;
    const hasTile = (value: number) =>
        hand.some(t => t.suit === discardedTile.suit && t.value === value);

    // 左塔子: v-2, v-1 があれば v でチー
    if (v >= 3 && hasTile(v - 2) && hasTile(v - 1)) return true;
    // 嵌張: v-1, v+1 があれば v でチー
    if (v >= 2 && v <= 8 && hasTile(v - 1) && hasTile(v + 1)) return true;
    // 右塔子: v+1, v+2 があれば v でチー
    if (v <= 7 && hasTile(v + 1) && hasTile(v + 2)) return true;

    return false;
}

/**
 * 大明槓できるかチェック
 */
function canDaiminkan(hand: Tile[], discardedTile: Tile): boolean {
    const matchingTiles = hand.filter(t =>
        t.suit === discardedTile.suit && t.value === discardedTile.value
    );
    return matchingTiles.length >= 3;
}

/**
 * リーチを宣言
 */
export function declareRiichi(state: GameState, tileId: string): GameState {
    const currentPlayer = state.players[state.currentPlayerIndex];

    // 門前チェック
    const hasOpenCall = currentPlayer.calls.some(c =>
        c.type === 'chi' || c.type === 'pon' || c.type === 'kan'
    );
    if (hasOpenCall) return state;

    // 点数チェック（1000点必要）
    if (currentPlayer.score < 1000) return state;

    // 聴牌チェック
    const testHand = removeTileFromHand(currentPlayer.hand, tileId);
    const waits = getTenpaiWaits(testHand, currentPlayer.calls);
    if (waits.length === 0) return state;

    // リーチ宣言
    const newPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex
            ? {
                ...p,
                isRiichi: true,
                riichiTurn: state.turnCount,
                isIppatsu: true,
                score: p.score - 1000
            }
            : p
    );

    // 打牌処理
    return performDiscard({ ...state, players: newPlayers, riichiSticks: state.riichiSticks + 1 }, tileId);
}

/**
 * ポンを実行
 */
export function executePon(state: GameState, callingPlayerIndex: number, tilesFromHand: [string, string]): GameState {
    if (!state.lastDiscard) return state;

    const player = state.players[callingPlayerIndex];
    const tile1 = player.hand.find(t => t.id === tilesFromHand[0]);
    const tile2 = player.hand.find(t => t.id === tilesFromHand[1]);

    if (!tile1 || !tile2) return state;

    const newCall: Call = {
        type: 'pon',
        tiles: [tile1, tile2, state.lastDiscard],
        fromPlayer: state.lastDiscardPlayer
    };

    let newHand = removeTileFromHand(player.hand, tilesFromHand[0]);
    newHand = removeTileFromHand(newHand, tilesFromHand[1]);
    newHand = sortHand(newHand);

    const newPlayers = state.players.map((p, i) =>
        i === callingPlayerIndex
            ? { ...p, hand: newHand, calls: [...p.calls, newCall], isIppatsu: false }
            : { ...p, isIppatsu: false }
    );

    return {
        ...state,
        players: newPlayers,
        currentPlayerIndex: callingPlayerIndex,
        phase: 'playing',
        canCall: false,
        canRon: [false, false, false, false],
        lastDiscard: undefined
    };
}

/**
 * チーを実行
 */
export function executeChi(state: GameState, callingPlayerIndex: number, tilesFromHand: [string, string]): GameState {
    if (!state.lastDiscard) return state;

    // チーは下家のみ可能
    if (callingPlayerIndex !== (state.lastDiscardPlayer! + 1) % 4) return state;

    const player = state.players[callingPlayerIndex];
    const tile1 = player.hand.find(t => t.id === tilesFromHand[0]);
    const tile2 = player.hand.find(t => t.id === tilesFromHand[1]);

    if (!tile1 || !tile2) return state;

    // 順子チェック
    const discardedTile = state.lastDiscard;
    const values = [tile1.value, tile2.value, discardedTile.value].sort((a, b) => a - b);
    if (values[1] - values[0] !== 1 || values[2] - values[1] !== 1) return state;
    if (tile1.suit !== discardedTile.suit || tile2.suit !== discardedTile.suit) return state;

    const newCall: Call = {
        type: 'chi',
        tiles: [tile1, tile2, discardedTile],
        fromPlayer: state.lastDiscardPlayer
    };

    let newHand = removeTileFromHand(player.hand, tilesFromHand[0]);
    newHand = removeTileFromHand(newHand, tilesFromHand[1]);
    newHand = sortHand(newHand);

    const newPlayers = state.players.map((p, i) =>
        i === callingPlayerIndex
            ? { ...p, hand: newHand, calls: [...p.calls, newCall], isIppatsu: false }
            : { ...p, isIppatsu: false }
    );

    return {
        ...state,
        players: newPlayers,
        currentPlayerIndex: callingPlayerIndex,
        phase: 'playing',
        canCall: false,
        canRon: [false, false, false, false],
        lastDiscard: undefined
    };
}

/**
 * 可能なチーの組み合わせを取得
 */
export function getChiOptions(hand: Tile[], discardedTile: Tile): [Tile, Tile][] {
    if (discardedTile.suit === 'honor') return [];

    const options: [Tile, Tile][] = [];
    const v = discardedTile.value;
    const sameSuit = hand.filter(t => t.suit === discardedTile.suit);

    // 左塔子: v-2, v-1 があれば (discardedが右)
    if (v >= 3) {
        const t1 = sameSuit.find(t => t.value === v - 2);
        const t2 = sameSuit.find(t => t.value === v - 1);
        if (t1 && t2) options.push([t1, t2]);
    }

    // 嵌張: v-1, v+1 があれば (discardedが真ん中)
    if (v >= 2 && v <= 8) {
        const t1 = sameSuit.find(t => t.value === v - 1);
        const t2 = sameSuit.find(t => t.value === v + 1);
        if (t1 && t2) options.push([t1, t2]);
    }

    // 右塔子: v+1, v+2 があれば (discardedが左)
    if (v <= 7) {
        const t1 = sameSuit.find(t => t.value === v + 1);
        const t2 = sameSuit.find(t => t.value === v + 2);
        if (t1 && t2) options.push([t1, t2]);
    }

    return options;
}

/**
 * 可能なポンの牌を取得
 */
export function getPonTiles(hand: Tile[], discardedTile: Tile): Tile[] {
    return hand.filter(t =>
        t.suit === discardedTile.suit && t.value === discardedTile.value
    );
}

/**
 * 暗槓できる牌を取得（手牌に4枚ある牌）
 */
export function getAnkanOptions(hand: Tile[]): Tile[][] {
    const counts = new Map<string, Tile[]>();

    for (const tile of hand) {
        const key = `${tile.suit}-${tile.value}`;
        if (!counts.has(key)) counts.set(key, []);
        counts.get(key)!.push(tile);
    }

    const options: Tile[][] = [];
    for (const tiles of counts.values()) {
        if (tiles.length >= 4) {
            options.push(tiles.slice(0, 4));
        }
    }

    return options;
}

/**
 * 暗槓を実行
 */
export function executeAnkan(state: GameState, tiles: [string, string, string, string]): GameState {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const kanTiles = tiles.map(id => currentPlayer.hand.find(t => t.id === id)).filter(Boolean) as Tile[];

    if (kanTiles.length !== 4) return state;

    const newCall: Call = {
        type: 'ankan',
        tiles: kanTiles
    };

    let newHand = currentPlayer.hand;
    for (const id of tiles) {
        newHand = removeTileFromHand(newHand, id);
    }

    const newPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex
            ? { ...p, hand: newHand, calls: [...p.calls, newCall] }
            : p
    );

    // 嶺上牌をツモる
    const rinshanTile = state.deadWall[0];
    if (!rinshanTile) return state;

    const playerWithRinshan = {
        ...newPlayers[state.currentPlayerIndex],
        hand: [...newPlayers[state.currentPlayerIndex].hand, rinshanTile]
    };
    newPlayers[state.currentPlayerIndex] = playerWithRinshan;

    // ドラを更新
    const kanCount = newPlayers.flatMap(p => p.calls).filter(c =>
        c.type === 'kan' || c.type === 'ankan' || c.type === 'kakan'
    ).length;
    const newDoraIndicators = getDoraIndicators(state.deadWall, kanCount);

    return {
        ...state,
        players: newPlayers,
        deadWall: state.deadWall.slice(1),
        doraIndicators: newDoraIndicators,
        phase: 'playing'
    };
}

/**
 * 大明槓を実行（他家の捨て牌で槓）
 */
export function executeDaiminkan(state: GameState, callingPlayerIndex: number, tilesFromHand: [string, string, string]): GameState {
    if (!state.lastDiscard) return state;

    const player = state.players[callingPlayerIndex];
    const kanTiles = tilesFromHand.map(id => player.hand.find(t => t.id === id)).filter(Boolean) as Tile[];

    if (kanTiles.length !== 3) return state;

    const newCall: Call = {
        type: 'kan',
        tiles: [...kanTiles, state.lastDiscard],
        fromPlayer: state.lastDiscardPlayer
    };

    let newHand = player.hand;
    for (const id of tilesFromHand) {
        newHand = removeTileFromHand(newHand, id);
    }

    const newPlayers = state.players.map((p, i) =>
        i === callingPlayerIndex
            ? { ...p, hand: newHand, calls: [...p.calls, newCall], isIppatsu: false }
            : { ...p, isIppatsu: false }
    );

    // 嶺上牌をツモる
    const rinshanTile = state.deadWall[0];
    if (!rinshanTile) return state;

    const playerWithRinshan = {
        ...newPlayers[callingPlayerIndex],
        hand: [...newPlayers[callingPlayerIndex].hand, rinshanTile]
    };
    newPlayers[callingPlayerIndex] = playerWithRinshan;

    // ドラを更新
    const kanCount = newPlayers.flatMap(p => p.calls).filter(c =>
        c.type === 'kan' || c.type === 'ankan' || c.type === 'kakan'
    ).length;
    const newDoraIndicators = getDoraIndicators(state.deadWall, kanCount);

    return {
        ...state,
        players: newPlayers,
        currentPlayerIndex: callingPlayerIndex,
        deadWall: state.deadWall.slice(1),
        doraIndicators: newDoraIndicators,
        phase: 'playing',
        canCall: false,
        canRon: [false, false, false, false],
        lastDiscard: undefined
    };
}

/**
 * ツモ上がりを実行
 */
export function executeTsumo(state: GameState): GameState {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const winningTile = currentPlayer.hand[currentPlayer.hand.length - 1]; // 最後のツモ牌

    // 役を評価
    const yakuList = evaluateYaku(
        currentPlayer.hand,
        currentPlayer.calls,
        winningTile,
        true, // isTsumo
        currentPlayer.isRiichi,
        currentPlayer.isIppatsu,
        false, // isRinshan
        state.wall.length === 0, // isHaitei
        false, // isHoutei
        false, // isChankan
        currentPlayer.riichiTurn === 0, // isDoubleRiichi (簡易)
        false, // isTenhou
        false, // isChihou
        state.roundWind,
        currentPlayer.wind,
        0 // doraCount (TODO: 計算)
    );

    if (yakuList.length === 0) return state; // 役なし

    const han = calculateTotalHan(yakuList, 0);
    const fu = calculateFu(
        currentPlayer.calls.filter(c => c.type !== 'ankan').length === 0,
        true,
        yakuList.some(y => y.name === 'pinfu'),
        yakuList.some(y => y.name === 'chitoitsu')
    );

    const isDealer = currentPlayer.wind === 'east';
    const scoreResult = calculateScore(han, fu, isDealer, true);

    // 点数移動
    const newPlayers = state.players.map((p, i) => {
        if (i === state.currentPlayerIndex) {
            return { ...p, score: p.score + scoreResult.total + state.riichiSticks * 1000 };
        } else if (state.players[i].wind === 'east') {
            return { ...p, score: p.score - scoreResult.fromDealer };
        } else {
            return { ...p, score: p.score - scoreResult.fromNonDealer };
        }
    });

    const winningHand: WinningHand = {
        player: state.currentPlayerIndex,
        tiles: currentPlayer.hand,
        calls: currentPlayer.calls,
        winningTile,
        isTsumo: true,
        yaku: yakuList,
        han,
        fu,
        score: scoreResult.total,
        isYakuman: yakuList.some(y => y.isYakuman)
    };

    return {
        ...state,
        players: newPlayers,
        phase: 'finished',
        winner: state.currentPlayerIndex,
        winningHand,
        riichiSticks: 0
    };
}

/**
 * ロンを実行
 */
export function executeRon(state: GameState, winningPlayerIndex: number): GameState {
    if (!state.lastDiscard || state.lastDiscardPlayer === undefined) return state;

    const winningPlayer = state.players[winningPlayerIndex];
    const losingPlayerIndex = state.lastDiscardPlayer;
    const winningTile = state.lastDiscard;
    const testHand = [...winningPlayer.hand, winningTile];

    // 役を評価
    const yakuList = evaluateYaku(
        testHand,
        winningPlayer.calls,
        winningTile,
        false, // isTsumo
        winningPlayer.isRiichi,
        winningPlayer.isIppatsu,
        false, false,
        state.wall.length === 0, // isHoutei
        false, false, false, false,
        state.roundWind,
        winningPlayer.wind,
        0
    );

    if (yakuList.length === 0) return state;

    const han = calculateTotalHan(yakuList, 0);
    const fu = calculateFu(
        winningPlayer.calls.filter(c => c.type !== 'ankan').length === 0,
        false,
        yakuList.some(y => y.name === 'pinfu'),
        yakuList.some(y => y.name === 'chitoitsu')
    );

    const isDealer = winningPlayer.wind === 'east';
    const scoreResult = calculateScore(han, fu, isDealer, false);

    // 点数移動（放銃者から）
    const newPlayers = state.players.map((p, i) => {
        if (i === winningPlayerIndex) {
            return { ...p, score: p.score + scoreResult.total + state.riichiSticks * 1000 };
        } else if (i === losingPlayerIndex) {
            return { ...p, score: p.score - scoreResult.total };
        }
        return p;
    });

    const winningHand: WinningHand = {
        player: winningPlayerIndex,
        tiles: testHand,
        calls: winningPlayer.calls,
        winningTile,
        isTsumo: false,
        yaku: yakuList,
        han,
        fu,
        score: scoreResult.total,
        isYakuman: yakuList.some(y => y.isYakuman)
    };

    return {
        ...state,
        players: newPlayers,
        phase: 'finished',
        winner: winningPlayerIndex,
        winningHand,
        riichiSticks: 0
    };
}

/**
 * パス（鳴きやロンをスキップ）
 */
export function passCall(state: GameState, playerIndex: number): GameState {
    // TODO: 複数人の鳴き/ロン待ちを管理
    const nextPlayerIndex = (state.lastDiscardPlayer! + 1) % 4;

    return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        phase: 'playing',
        canCall: false,
        canRon: [false, false, false, false]
    };
}
