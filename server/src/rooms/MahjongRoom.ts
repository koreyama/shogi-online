import { Room, Client } from "colyseus";
import { MahjongState, MahjongPlayer, MahjongTile, MahjongCall } from "./schema/MahjongState";
import { ArraySchema } from "@colyseus/schema";
import { TileData, Wind, WIND_ORDER } from "../lib/mahjong/types";
import { isWinningHand, getTenpaiWaits, calculateShanten } from "../lib/mahjong/hand-evaluator";
import { evaluateYaku } from "../lib/mahjong/yaku";
import { calculateScore, countDora } from "../lib/mahjong/scoring";
import { decidePlayAction, decideCallAction } from "../lib/mahjong/ai";

const WINDS = ["east", "south", "west", "north"];

/**
 * Convert MahjongTile schema to plain TileData
 */
function toTileData(t: MahjongTile): TileData {
    return { id: t.id, suit: t.suit as any, value: t.value, isRed: t.isRed };
}

function toCallData(c: MahjongCall) {
    return {
        callType: c.callType,
        tiles: [...c.tiles].map(toTileData),
        fromPlayer: c.fromPlayer,
    };
}

export class MahjongRoom extends Room<MahjongState> {
    maxClients = 4;
    private gameStarted = false;
    private cpuTimers: NodeJS.Timeout[] = [];
    private wall: any[] = [];
    private deadWall: any[] = [];
    private uraDoraIndicators: any[] = [];
    private playerDiscardHistory: Map<number, TileData[]> = new Map(); // For furiten

    // Round state
    private isFirstTurn = true;
    private rinshanFlag = false;

    onCreate(options: any) {
        this.setState(new MahjongState());
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        this.state.minPlayers = options.minPlayers || 3;
        this.state.maxPlayers = 4;

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        for (let i = 0; i < 4; i++) {
            this.state.canRon.push(false);
            this.state.canCall.push(false);
        }

        this.onMessage("startGame", (client) => this.handleStartGame(client));
        this.onMessage("nextRound", (client) => this.handleNextRound(client));
        this.onMessage("discard", (client, msg) => this.handleDiscard(client, msg));
        this.onMessage("chi", (client, msg) => this.handleChi(client, msg));
        this.onMessage("pon", (client, msg) => this.handlePon(client, msg));
        this.onMessage("kan", (client, msg) => this.handleKan(client, msg));
        this.onMessage("ankan", (client, msg) => this.handleAnkan(client, msg));
        this.onMessage("riichi", (client, msg) => this.handleRiichi(client, msg));
        this.onMessage("tsumo", (client) => this.handleTsumo(client));
        this.onMessage("ron", (client) => this.handleRon(client));
        this.onMessage("pass", (client) => this.handlePass(client));
        this.onMessage("chat", (client, msg) => this.broadcast("chat", msg));

        console.log(`[MahjongRoom] Created ${this.roomId}`);
    }

    onJoin(client: Client, options: any) {
        console.log("MahjongRoom joined:", client.sessionId, options.name);
        const playerCount = this.state.players.size;
        if (playerCount >= 4) return;

        const player = new MahjongPlayer();
        player.sessionId = client.sessionId;
        player.name = options.name || `Player ${playerCount + 1}`;
        player.seatIndex = playerCount;
        player.wind = WINDS[playerCount];
        player.score = 25000;
        player.isCpu = false;
        player.isConnected = true;

        this.state.players.set(client.sessionId, player);
        this.broadcast("playerJoined", { name: player.name, seat: player.seatIndex });
    }

    onLeave(client: Client, consented: boolean) {
        console.log("MahjongRoom left:", client.sessionId);
        const player = this.state.players.get(client.sessionId);
        if (player) {
            if (this.gameStarted) {
                player.isConnected = false;
                player.isCpu = true;
                player.name = `CPU ${player.seatIndex + 1}`;
            } else {
                this.state.players.delete(client.sessionId);
            }
        }
        if (!this.gameStarted && this.state.players.size === 0) {
            this.disconnect();
        }
    }

    // ==================== GAME SETUP ====================

    handleStartGame(client: Client) {
        if (this.gameStarted) return;
        if (this.state.players.size < 1) return;

        const currentCount = this.state.players.size;
        const targetCount = this.state.minPlayers || 4;
        for (let i = currentCount; i < targetCount; i++) {
            const cpuPlayer = new MahjongPlayer();
            cpuPlayer.sessionId = `cpu-${i}`;
            cpuPlayer.name = `CPU ${i + 1}`;
            cpuPlayer.seatIndex = i;
            cpuPlayer.wind = WINDS[i];
            cpuPlayer.score = 25000;
            cpuPlayer.isCpu = true;
            cpuPlayer.isConnected = true;
            this.state.players.set(cpuPlayer.sessionId, cpuPlayer);
        }

        this.gameStarted = true;
        this.state.phase = "playing";
        this.initializeGame();
        this.broadcast("gameStart", { message: "Game started!" });
        this.lock();
    }

    private initializeGame() {
        const tiles = this.createAllTiles();
        this.shuffleArray(tiles);

        this.deadWall = tiles.splice(-14);

        // Dora indicator
        const doraIndicator = new MahjongTile();
        Object.assign(doraIndicator, this.deadWall[4]);
        this.state.doraIndicators.push(doraIndicator);

        // Store ura dora
        this.uraDoraIndicators = [this.deadWall[5]];

        // Deal 13 tiles
        const players = Array.from(this.state.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
        for (let i = 0; i < 13; i++) {
            for (const player of players) {
                const tile = tiles.shift()!;
                const tileSchema = new MahjongTile();
                Object.assign(tileSchema, tile);
                player.hand.push(tileSchema);
            }
        }

        for (const player of players) {
            this.sortHand(player.hand);
        }

        this.wall = tiles;
        this.state.remainingTiles = this.wall.length;
        this.state.currentPlayerIndex = 0;
        this.state.turnCount = 0;
        this.isFirstTurn = true;
        this.rinshanFlag = false;

        // Initialize furiten tracking
        this.playerDiscardHistory.clear();
        for (const p of players) {
            this.playerDiscardHistory.set(p.seatIndex, []);
        }

        // First player draws
        this.drawTile(0);
    }

    private createAllTiles(): any[] {
        const tiles: any[] = [];
        let idCounter = 0;
        for (const suit of ["man", "pin", "sou"]) {
            for (let value = 1; value <= 9; value++) {
                for (let copy = 0; copy < 4; copy++) {
                    tiles.push({
                        id: `${suit}${value}-${idCounter++}`,
                        suit, value,
                        isRed: value === 5 && copy === 0
                    });
                }
            }
        }
        for (let value = 1; value <= 7; value++) {
            for (let copy = 0; copy < 4; copy++) {
                tiles.push({
                    id: `honor${value}-${idCounter++}`,
                    suit: "honor", value, isRed: false
                });
            }
        }
        return tiles;
    }

    private shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    private sortHand(hand: ArraySchema<MahjongTile>) {
        const arr = [...hand];
        arr.sort((a, b) => {
            const suitOrder: Record<string, number> = { man: 0, pin: 1, sou: 2, honor: 3 };
            if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
            return a.value - b.value;
        });
        hand.clear();
        arr.forEach(t => hand.push(t));
    }

    // ==================== TILE DRAWING ====================

    private drawTile(playerIndex: number) {
        const player = this.getPlayerBySeat(playerIndex);
        if (!player) return;

        if (this.wall.length === 0) {
            this.handleDraw();
            return;
        }

        const drawnTile = this.wall.shift()!;
        const tileSchema = new MahjongTile();
        Object.assign(tileSchema, drawnTile);
        player.hand.push(tileSchema);

        this.state.remainingTiles = this.wall.length;
        this.state.turnCount++;
        this.state.currentPlayerIndex = playerIndex;
        this.state.lastAction = `draw:${playerIndex}`;

        // Check tsumo win opportunity
        const handData = [...player.hand].map(toTileData);
        const callCount = player.calls.length;
        const canWin = isWinningHand(handData, callCount);

        if (canWin) {
            this.state.lastAction = `draw:${playerIndex}:canTsumo`;
        }

        this.isFirstTurn = false;

        if (player.isCpu) {
            this.scheduleCpuAction(playerIndex, canWin);
        }
    }

    private getPlayerBySeat(seatIndex: number): MahjongPlayer | undefined {
        for (const player of this.state.players.values()) {
            if (player.seatIndex === seatIndex) return player;
        }
        return undefined;
    }

    // ==================== CPU AI ====================

    private scheduleCpuAction(seatIndex: number, canTsumo: boolean = false) {
        const timer = setTimeout(() => {
            const player = this.getPlayerBySeat(seatIndex);
            if (!player || !player.isCpu) return;
            if (this.state.phase !== "playing") return;

            const hand = [...player.hand].map(toTileData);
            const calls = [...player.calls].map(toCallData);

            const decision = decidePlayAction(hand, calls, player.isRiichi, canTsumo);

            switch (decision.action) {
                case 'tsumo':
                    this.executeTsumo(player);
                    break;
                case 'riichi':
                    if (decision.tileId) {
                        player.isRiichi = true;
                        player.isIppatsu = true;
                        this.state.riichiSticks++;
                        player.score -= 1000;
                        this.broadcast("riichi", { seat: player.seatIndex });
                        this.executeDiscard(player, decision.tileId);
                    }
                    break;
                case 'ankan':
                    if (decision.tileId) {
                        this.executeAnkan(player, decision.tileId);
                    }
                    break;
                case 'discard':
                    if (decision.tileId) {
                        this.executeDiscard(player, decision.tileId);
                    }
                    break;
            }
        }, 600 + Math.random() * 400);
        this.cpuTimers.push(timer);
    }

    private scheduleCpuCallResponse(seatIndex: number) {
        const timer = setTimeout(() => {
            const player = this.getPlayerBySeat(seatIndex);
            if (!player || !player.isCpu) return;
            if (this.state.phase !== "calling") return;

            const hand = [...player.hand].map(toTileData);
            const calls = [...player.calls].map(toCallData);
            const discardTile = this.state.lastDiscard.length > 0
                ? toTileData(this.state.lastDiscard[0])
                : null;

            if (!discardTile) {
                this.cpuPass(player);
                return;
            }

            const decision = decideCallAction(
                hand, calls, discardTile,
                this.state.canCall[seatIndex],
                false, // canChi simplified
                this.state.canRon[seatIndex],
            );

            switch (decision.action) {
                case 'ron':
                    this.executeRon(player);
                    break;
                case 'pon':
                    this.executePon(player);
                    break;
                default:
                    this.cpuPass(player);
                    break;
            }
        }, 400 + Math.random() * 300);
        this.cpuTimers.push(timer);
    }

    private cpuPass(player: MahjongPlayer) {
        this.state.canCall[player.seatIndex] = false;
        this.state.canRon[player.seatIndex] = false;

        const anyoneCanStillCall = Array.from(this.state.canCall).some(b => b) ||
            Array.from(this.state.canRon).some(b => b);
        if (!anyoneCanStillCall) {
            this.finishCallPhase();
        }
    }

    // ==================== PLAYER ACTIONS ====================

    handleDiscard(client: Client, msg: { tileId: string }) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (player.seatIndex !== this.state.currentPlayerIndex) return;
        if (this.state.phase !== "playing") return;

        this.executeDiscard(player, msg.tileId);
    }

    private executeDiscard(player: MahjongPlayer, tileId: string) {
        const tileIdx = player.hand.findIndex(t => t.id === tileId);
        if (tileIdx < 0) return;

        const tile = player.hand[tileIdx];
        player.hand.splice(tileIdx, 1);
        player.discards.push(tile);

        // Track discard for furiten
        const history = this.playerDiscardHistory.get(player.seatIndex) || [];
        history.push(toTileData(tile));
        this.playerDiscardHistory.set(player.seatIndex, history);

        this.sortHand(player.hand);

        // Clear ippatsu after discard
        if (player.isIppatsu) player.isIppatsu = false;

        this.state.lastDiscard.clear();
        this.state.lastDiscard.push(tile);
        this.state.lastDiscardPlayer = player.seatIndex;
        this.state.lastAction = `discard:${player.seatIndex}:${tile.id}`;

        // Check for Ron/Pon/Chi/Kan opportunities
        this.checkCallOpportunities(tile, player.seatIndex);
    }

    handleTsumo(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player || player.seatIndex !== this.state.currentPlayerIndex) return;
        if (this.state.phase !== "playing") return;

        // Validate winning hand
        const hand = [...player.hand].map(toTileData);
        const callCount = player.calls.length;
        if (!isWinningHand(hand, callCount)) {
            console.log("[MahjongRoom] Invalid tsumo attempt");
            return;
        }

        this.executeTsumo(player);
    }

    private executeTsumo(player: MahjongPlayer) {
        const hand = [...player.hand].map(toTileData);
        const calls = [...player.calls].map(toCallData);
        const winTile = hand[hand.length - 1]; // Last drawn tile
        const seatWind = player.wind as Wind;
        const roundWind = this.state.roundWind as Wind;
        const isDealer = player.seatIndex === ((this.state.roundNumber - 1) % this.state.players.size);

        // Evaluate yaku
        const yakuList = evaluateYaku(
            hand, calls, winTile,
            true, // isTsumo
            player.isRiichi,
            player.isIppatsu,
            false, // double riichi
            false, false, // tenhou/chihou
            this.rinshanFlag,
            this.wall.length === 0, // haitei
            false, false,
            roundWind, seatWind,
        );

        // Count dora
        const doraIndicators = [...this.state.doraIndicators].map(toTileData);
        const doraCount = countDora(hand, calls, doraIndicators, this.uraDoraIndicators, player.isRiichi);
        if (doraCount > 0) {
            yakuList.push({ name: 'dora', nameJp: `ドラ${doraCount}`, han: doraCount, isYakuman: false });
        }

        if (yakuList.length === 0) {
            console.log("[MahjongRoom] No yaku for tsumo");
            return;
        }

        const score = calculateScore(yakuList, true, isDealer, this.state.honba, hand, calls, winTile);

        // Apply score transfer
        const playerCount = this.state.players.size;
        if (isDealer) {
            const each = Math.ceil(score.totalScore / (playerCount - 1));
            this.state.players.forEach(p => {
                if (p.seatIndex !== player.seatIndex) {
                    p.score -= each;
                }
            });
        } else {
            const dealerSeat = (this.state.roundNumber - 1) % playerCount;
            const dealerPay = Math.ceil(score.totalScore / 2);
            const otherPay = Math.ceil((score.totalScore - dealerPay) / (playerCount - 2));
            this.state.players.forEach(p => {
                if (p.seatIndex === player.seatIndex) return;
                if (p.seatIndex === dealerSeat) {
                    p.score -= dealerPay;
                } else {
                    p.score -= otherPay;
                }
            });
        }
        player.score += score.totalScore + this.state.riichiSticks * 1000;

        this.state.isGameOver = true;
        this.state.winner = player.seatIndex;
        this.state.winnerName = player.name;
        this.state.winningScore = score.totalScore;
        this.state.winningYaku = score.yakuSummary;
        this.state.phase = "finished";
        this.state.riichiSticks = 0;

        this.broadcast("gameOver", {
            winner: player.name,
            type: "tsumo",
            score: score.totalScore,
            yaku: score.yakuSummary,
            label: score.scoreLabel,
            han: score.han,
            fu: score.fu,
        });
    }

    handleRon(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (this.state.phase !== "calling") return;
        if (!this.state.canRon[player.seatIndex]) return;

        this.executeRon(player);
    }

    private executeRon(player: MahjongPlayer) {
        const discardTile = this.state.lastDiscard.length > 0 ? toTileData(this.state.lastDiscard[0]) : null;
        if (!discardTile) return;

        const hand = [...player.hand].map(toTileData);
        const fullHand = [...hand, discardTile];
        const calls = [...player.calls].map(toCallData);
        const callCount = calls.length;

        if (!isWinningHand(fullHand, callCount)) {
            console.log("[MahjongRoom] Invalid ron attempt");
            return;
        }

        const seatWind = player.wind as Wind;
        const roundWind = this.state.roundWind as Wind;
        const isDealer = player.seatIndex === ((this.state.roundNumber - 1) % this.state.players.size);

        // Evaluate yaku
        const yakuList = evaluateYaku(
            fullHand, calls, discardTile,
            false, // isTsumo = false (ron)
            player.isRiichi,
            player.isIppatsu,
            false, false, false,
            false,
            false,
            this.wall.length === 0, // houtei
            false,
            roundWind, seatWind,
        );

        // Count dora
        const doraIndicators = [...this.state.doraIndicators].map(toTileData);
        const doraCount = countDora(fullHand, calls, doraIndicators, this.uraDoraIndicators, player.isRiichi);
        if (doraCount > 0) {
            yakuList.push({ name: 'dora', nameJp: `ドラ${doraCount}`, han: doraCount, isYakuman: false });
        }

        if (yakuList.length === 0) {
            console.log("[MahjongRoom] No yaku for ron");
            return;
        }

        const score = calculateScore(yakuList, false, isDealer, this.state.honba, fullHand, calls, discardTile);

        // Ron: loser pays all
        const loserSeat = this.state.lastDiscardPlayer;
        this.state.players.forEach(p => {
            if (p.seatIndex === loserSeat) {
                p.score -= score.totalScore;
            }
        });
        player.score += score.totalScore + this.state.riichiSticks * 1000;

        // Add winning tile to hand for display
        const winTileSchema = new MahjongTile();
        Object.assign(winTileSchema, this.state.lastDiscard[0]);
        player.hand.push(winTileSchema);

        this.state.isGameOver = true;
        this.state.winner = player.seatIndex;
        this.state.winnerName = player.name;
        this.state.winningScore = score.totalScore;
        this.state.winningYaku = score.yakuSummary;
        this.state.phase = "finished";
        this.state.riichiSticks = 0;

        // Clear call flags
        this.clearCallFlags();

        this.broadcast("gameOver", {
            winner: player.name,
            type: "ron",
            score: score.totalScore,
            yaku: score.yakuSummary,
            label: score.scoreLabel,
            han: score.han,
            fu: score.fu,
        });
    }

    handleRiichi(client: Client, msg: any) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (player.seatIndex !== this.state.currentPlayerIndex) return;
        if (player.isRiichi) return;
        if (player.score < 1000) return;

        // Validate tenpai
        const hand = [...player.hand].map(toTileData);
        // Need to check if discarding a tile leaves tenpai
        let canRiichi = false;
        for (const tile of hand) {
            const remaining = hand.filter(t => t.id !== tile.id);
            const waits = getTenpaiWaits(remaining, player.calls.length);
            if (waits.length > 0) {
                canRiichi = true;
                break;
            }
        }

        if (!canRiichi) {
            console.log("[MahjongRoom] Cannot riichi: not tenpai");
            return;
        }

        player.isRiichi = true;
        player.isIppatsu = true;
        this.state.riichiSticks++;
        player.score -= 1000;
        this.broadcast("riichi", { seat: player.seatIndex });

        // Discard the specified tile
        if (msg && msg.tileId) {
            this.executeDiscard(player, msg.tileId);
        }
    }

    handlePon(client: Client, msg: any) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !this.state.canCall[player.seatIndex]) return;

        this.executePon(player);
    }

    private executePon(player: MahjongPlayer) {
        const discard = this.state.lastDiscard[0];
        if (!discard) return;

        const matches = [...player.hand].filter(t => t.suit === discard.suit && t.value === discard.value);
        if (matches.length < 2) return;

        // Remove 2 matching tiles from hand
        for (let i = 0; i < 2; i++) {
            const idx = player.hand.findIndex(t => t.id === matches[i].id);
            if (idx >= 0) player.hand.splice(idx, 1);
        }

        // Create call
        const call = new MahjongCall();
        call.callType = "pon";
        call.fromPlayer = this.state.lastDiscardPlayer;
        call.tiles.push(discard);
        call.tiles.push(matches[0]);
        call.tiles.push(matches[1]);
        player.calls.push(call);

        this.clearCallFlags();
        this.clearCpuTimers();

        this.state.currentPlayerIndex = player.seatIndex;
        this.state.phase = "playing";
        this.state.lastAction = `pon:${player.seatIndex}`;

        this.sortHand(player.hand);

        // After pon, player must discard (no draw)
        if (player.isCpu) {
            this.scheduleCpuAction(player.seatIndex, false);
        }
    }

    handleChi(client: Client, msg: { tiles: string[] }) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !this.state.canCall[player.seatIndex]) return;

        // Next player only
        const playerCount = this.state.players.size;
        if (player.seatIndex !== (this.state.lastDiscardPlayer + 1) % playerCount) return;

        const discard = this.state.lastDiscard[0];
        if (!discard) return;

        // Validate and find the tiles
        let tile1: MahjongTile | null = null;
        let tile2: MahjongTile | null = null;

        if (msg.tiles && msg.tiles.length === 2) {
            // Client specified which tiles to use
            tile1 = [...player.hand].find(t => t.id === msg.tiles[0]) || null;
            tile2 = [...player.hand].find(t => t.id === msg.tiles[1]) || null;
        }

        if (!tile1 || !tile2) {
            // Auto-pick: find a valid sequence
            const v = discard.value;
            const s = discard.suit;
            const h = [...player.hand];

            // Try (v-2, v-1, v), (v-1, v, v+1), (v, v+1, v+2)
            const patterns = [
                [v - 2, v - 1],
                [v - 1, v + 1],
                [v + 1, v + 2],
            ];

            for (const [a, b] of patterns) {
                if (a < 1 || b < 1 || a > 9 || b > 9) continue;
                const t1 = h.find(t => t.suit === s && t.value === a);
                const t2 = h.find(t => t.suit === s && t.value === b && t.id !== (t1?.id || ''));
                if (t1 && t2) {
                    tile1 = t1;
                    tile2 = t2;
                    break;
                }
            }
        }

        if (!tile1 || !tile2) return;

        // Validate sequence
        const vals = [discard.value, tile1.value, tile2.value].sort((a, b) => a - b);
        if (vals[1] - vals[0] !== 1 || vals[2] - vals[1] !== 1) return;
        if (tile1.suit !== discard.suit || tile2.suit !== discard.suit) return;

        // Remove tiles from hand
        const idx1 = player.hand.findIndex(t => t.id === tile1!.id);
        if (idx1 >= 0) player.hand.splice(idx1, 1);
        const idx2 = player.hand.findIndex(t => t.id === tile2!.id);
        if (idx2 >= 0) player.hand.splice(idx2, 1);

        // Create call
        const call = new MahjongCall();
        call.callType = "chi";
        call.fromPlayer = this.state.lastDiscardPlayer;
        call.tiles.push(discard);
        call.tiles.push(tile1);
        call.tiles.push(tile2);
        player.calls.push(call);

        this.clearCallFlags();
        this.clearCpuTimers();

        this.state.currentPlayerIndex = player.seatIndex;
        this.state.phase = "playing";
        this.state.lastAction = `chi:${player.seatIndex}`;

        this.sortHand(player.hand);

        if (player.isCpu) {
            this.scheduleCpuAction(player.seatIndex, false);
        }
    }

    handleKan(client: Client, msg: any) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !this.state.canCall[player.seatIndex]) return;

        const discard = this.state.lastDiscard[0];
        if (!discard) return;

        // Daiminkan: need 3 matching tiles in hand
        const matches = [...player.hand].filter(t => t.suit === discard.suit && t.value === discard.value);
        if (matches.length < 3) return;

        // Remove 3 tiles from hand
        for (let i = 0; i < 3; i++) {
            const idx = player.hand.findIndex(t => t.id === matches[i].id);
            if (idx >= 0) player.hand.splice(idx, 1);
        }

        // Create kan call
        const call = new MahjongCall();
        call.callType = "kan";
        call.fromPlayer = this.state.lastDiscardPlayer;
        call.tiles.push(discard);
        for (const m of matches) call.tiles.push(m);
        player.calls.push(call);

        // Add new dora indicator
        this.addKanDora();

        this.clearCallFlags();
        this.clearCpuTimers();

        this.state.currentPlayerIndex = player.seatIndex;
        this.state.lastAction = `kan:${player.seatIndex}`;

        // After kan, draw from dead wall (rinshan)
        this.drawFromDeadWall(player);
    }

    handleAnkan(client: Client, msg: { tileId?: string }) {
        const player = this.state.players.get(client.sessionId);
        if (!player || player.seatIndex !== this.state.currentPlayerIndex) return;
        if (this.state.phase !== "playing") return;

        // Find 4 matching tiles
        let targetTile: MahjongTile | undefined;
        if (msg.tileId) {
            targetTile = [...player.hand].find(t => t.id === msg.tileId);
        }
        if (!targetTile) return;

        const matches = [...player.hand].filter(t => t.suit === targetTile!.suit && t.value === targetTile!.value);
        if (matches.length < 4) return;

        // Cannot ankan certain tiles during riichi (simplified: allow for now)

        // Remove 4 tiles
        for (const m of matches) {
            const idx = player.hand.findIndex(t => t.id === m.id);
            if (idx >= 0) player.hand.splice(idx, 1);
        }

        const call = new MahjongCall();
        call.callType = "ankan";
        call.fromPlayer = player.seatIndex;
        for (const m of matches) call.tiles.push(m);
        player.calls.push(call);

        this.addKanDora();
        this.state.lastAction = `ankan:${player.seatIndex}`;

        this.drawFromDeadWall(player);
    }

    private executeAnkan(player: MahjongPlayer, tileId: string) {
        const targetTile = [...player.hand].find(t => t.id === tileId);
        if (!targetTile) return;

        const matches = [...player.hand].filter(t => t.suit === targetTile.suit && t.value === targetTile.value);
        if (matches.length < 4) return;

        for (const m of matches) {
            const idx = player.hand.findIndex(t => t.id === m.id);
            if (idx >= 0) player.hand.splice(idx, 1);
        }

        const call = new MahjongCall();
        call.callType = "ankan";
        call.fromPlayer = player.seatIndex;
        for (const m of matches) call.tiles.push(m);
        player.calls.push(call);

        this.addKanDora();
        this.state.lastAction = `ankan:${player.seatIndex}`;

        this.drawFromDeadWall(player);
    }

    private drawFromDeadWall(player: MahjongPlayer) {
        if (this.deadWall.length === 0) {
            this.handleDraw();
            return;
        }

        const drawnTile = this.deadWall.shift()!;
        const tileSchema = new MahjongTile();
        Object.assign(tileSchema, drawnTile);
        player.hand.push(tileSchema);

        // Replenish dead wall from main wall
        if (this.wall.length > 0) {
            this.deadWall.push(this.wall.pop()!);
        }

        this.state.remainingTiles = this.wall.length;
        this.state.phase = "playing";
        this.rinshanFlag = true;

        // Check tsumo win after rinshan draw
        const handData = [...player.hand].map(toTileData);
        const canWin = isWinningHand(handData, player.calls.length);

        if (canWin && player.isCpu) {
            this.executeTsumo(player);
        } else if (player.isCpu) {
            this.scheduleCpuAction(player.seatIndex, false);
        }

        this.state.lastAction = `draw:${player.seatIndex}:rinshan`;
    }

    private addKanDora() {
        // Reveal next dora indicator from dead wall
        if (this.deadWall.length > 4 + this.state.doraIndicators.length) {
            const idx = 4 + this.state.doraIndicators.length;
            const newDora = new MahjongTile();
            Object.assign(newDora, this.deadWall[idx]);
            this.state.doraIndicators.push(newDora);
        }
    }

    handlePass(client: Client) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        this.state.canCall[player.seatIndex] = false;
        this.state.canRon[player.seatIndex] = false;

        const anyoneCanStillCall = Array.from(this.state.canCall).some(b => b) ||
            Array.from(this.state.canRon).some(b => b);
        if (!anyoneCanStillCall) {
            this.finishCallPhase();
        }
    }

    // ==================== CALL DETECTION ====================

    private checkCallOpportunities(tile: MahjongTile, discarderSeat: number) {
        let hasOpportunity = false;
        const playerCount = this.state.players.size;

        this.state.players.forEach((p) => {
            if (p.seatIndex === discarderSeat) return;

            const hand = [...p.hand].map(toTileData);
            const tileData = toTileData(tile);

            // 1. Ron Check (with furiten check)
            const potentialHand = [...hand, tileData];
            const isWin = isWinningHand(potentialHand, p.calls.length);
            if (isWin) {
                // Furiten check: if player's discards include any of their tenpai waits
                const handWithoutWin = hand;
                const waits = getTenpaiWaits(handWithoutWin, p.calls.length);
                const discardHistory = this.playerDiscardHistory.get(p.seatIndex) || [];
                const isFuriten = waits.some(w =>
                    discardHistory.some(d => d.suit === w.suit && d.value === w.value)
                );

                if (!isFuriten) {
                    this.state.canRon[p.seatIndex] = true;
                    hasOpportunity = true;
                }
            }

            // 2. Pon Check (2+ matching tiles)
            const ponCount = hand.filter(t => t.suit === tileData.suit && t.value === tileData.value).length;
            if (ponCount >= 2) {
                this.state.canCall[p.seatIndex] = true;
                hasOpportunity = true;
            }

            // 3. Kan Check (3 matching tiles = daiminkan)
            if (ponCount >= 3) {
                // canCall already set by pon check
            }
        });

        // 4. Chi Check (next player only, number tiles only)
        const nextSeat = (discarderSeat + 1) % playerCount;
        const nextPlayer = this.getPlayerBySeat(nextSeat);
        if (nextPlayer && tile.suit !== 'honor') {
            const h = [...nextPlayer.hand];
            const v = tile.value;
            const s = tile.suit;
            const has = (val: number) => h.some(t => t.suit === s && t.value === val);

            if ((has(v - 2) && has(v - 1)) || (has(v - 1) && has(v + 1)) || (has(v + 1) && has(v + 2))) {
                this.state.canCall[nextSeat] = true;
                hasOpportunity = true;
            }
        }

        if (hasOpportunity) {
            this.state.phase = "calling";

            // Schedule CPU responses for eligible CPU players
            this.state.players.forEach(p => {
                if (p.isCpu && (this.state.canCall[p.seatIndex] || this.state.canRon[p.seatIndex])) {
                    this.scheduleCpuCallResponse(p.seatIndex);
                }
            });

            // Auto-pass timeout
            const timer = setTimeout(() => {
                if (this.state.phase === "calling") {
                    this.finishCallPhase();
                }
            }, 5000);
            this.cpuTimers.push(timer);
        } else {
            this.nextTurn();
        }
    }

    private finishCallPhase() {
        this.clearCpuTimers();
        this.clearCallFlags();
        this.state.phase = "playing";
        this.nextTurn();
    }

    // ==================== TURN MANAGEMENT ====================

    private nextTurn() {
        const playerCount = this.state.players.size;
        const nextIndex = (this.state.currentPlayerIndex + 1) % playerCount;
        this.rinshanFlag = false;
        this.drawTile(nextIndex);
    }

    // ==================== DRAW (流局) ====================

    private handleDraw() {
        const playerCount = this.state.players.size;
        const tenpaiPlayers: MahjongPlayer[] = [];
        const notenPlayers: MahjongPlayer[] = [];

        this.state.players.forEach(p => {
            const hand = [...p.hand].map(toTileData);
            const waits = getTenpaiWaits(hand, p.calls.length);
            if (waits.length > 0) {
                tenpaiPlayers.push(p);
            } else {
                notenPlayers.push(p);
            }
        });

        // Noten bappu (ノーテン罰符): 3000 points redistributed
        if (tenpaiPlayers.length > 0 && tenpaiPlayers.length < playerCount) {
            const totalPenalty = 3000;
            const tenpaiReward = Math.floor(totalPenalty / tenpaiPlayers.length);
            const notenPenalty = Math.floor(totalPenalty / notenPlayers.length);

            for (const p of tenpaiPlayers) p.score += tenpaiReward;
            for (const p of notenPlayers) p.score -= notenPenalty;
        }

        this.state.phase = "draw";
        this.state.lastAction = "draw:ryuukyoku";

        // Renchan if dealer is tenpai
        const dealerSeat = (this.state.roundNumber - 1) % playerCount;
        const dealerTenpai = tenpaiPlayers.some(p => p.seatIndex === dealerSeat);
        if (dealerTenpai) {
            this.state.honba++;
        }

        this.broadcast("gameOver", {
            type: "draw",
            tenpaiPlayers: tenpaiPlayers.map(p => p.name),
        });
    }

    // ==================== NEXT ROUND ====================

    handleNextRound(client: Client) {
        if (this.state.phase !== "finished" && this.state.phase !== "draw") return;

        const playerCount = this.state.players.size;
        const dealerSeat = (this.state.roundNumber - 1) % playerCount;
        const dealerWon = this.state.winner === dealerSeat;

        this.cleanupBoard();

        if (dealerWon) {
            // Renchan: same round, increment honba
            this.state.honba++;
        } else {
            this.state.roundNumber++;
            this.state.honba = 0;

            if (this.state.roundNumber > playerCount) {
                this.state.roundNumber = 1;
                const wIdx = WINDS.indexOf(this.state.roundWind);
                const nextWind = WINDS[(wIdx + 1) % 4];

                // Check game end (after south round for 4p, or after east for quick game)
                if (this.state.roundWind === 'south' || (playerCount === 3 && this.state.roundWind === 'east' && wIdx >= 1)) {
                    // Game over - check final scores
                    this.broadcast("gameEnd", {
                        scores: Array.from(this.state.players.values()).map(p => ({
                            name: p.name, score: p.score, seat: p.seatIndex
                        }))
                    });
                    return;
                }
                this.state.roundWind = nextWind;
            }

            // Rotate winds
            this.state.players.forEach(p => {
                const wIdx = WINDS.indexOf(p.wind);
                p.wind = WINDS[(wIdx + playerCount - 1) % playerCount];
            });
        }

        this.state.phase = "playing";
        this.state.isGameOver = false;
        this.state.winner = -1;
        this.state.winnerName = "";
        this.state.winningScore = 0;
        this.state.winningYaku = "";

        this.initializeGame();
        this.broadcast("gameStart", { message: "Next round started!" });
    }

    // ==================== CLEANUP ====================

    private clearCallFlags() {
        const playerCount = this.state.players.size;
        for (let i = 0; i < 4; i++) {
            this.state.canCall[i] = false;
            this.state.canRon[i] = false;
        }
    }

    private clearCpuTimers() {
        this.cpuTimers.forEach(t => clearTimeout(t));
        this.cpuTimers = [];
    }

    private cleanupBoard() {
        this.state.doraIndicators.clear();
        this.state.lastDiscard.clear();
        this.state.canCall.clear();
        this.state.canRon.clear();
        for (let i = 0; i < 4; i++) {
            this.state.canCall.push(false);
            this.state.canRon.push(false);
        }

        this.state.players.forEach(p => {
            p.hand.clear();
            p.discards.clear();
            p.calls.clear();
            p.isRiichi = false;
            p.isIppatsu = false;
        });

        this.clearCpuTimers();
    }

    onDispose() {
        this.clearCpuTimers();
        console.log(`[MahjongRoom] Disposed ${this.roomId}`);
    }
}
