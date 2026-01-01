import { Room, Client } from "colyseus";
import { MahjongState, MahjongPlayer, MahjongTile, MahjongCall } from "./schema/MahjongState";
import { ArraySchema } from "@colyseus/schema";

const WINDS = ["east", "south", "west", "north"];

export class MahjongRoom extends Room<MahjongState> {
    maxClients = 4;
    private gameStarted = false;
    private cpuTimers: NodeJS.Timeout[] = [];

    onCreate(options: any) {
        this.setState(new MahjongState());
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        // Set min players (3 or 4)
        this.state.minPlayers = options.minPlayers || 3;
        this.state.maxPlayers = 4;

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        // Initialize canRon and canCall arrays
        for (let i = 0; i < 4; i++) {
            this.state.canRon.push(false);
            this.state.canCall.push(false);
        }

        this.onMessage("startGame", (client) => this.handleStartGame(client));
        this.onMessage("discard", (client, msg) => this.handleDiscard(client, msg));
        this.onMessage("chi", (client, msg) => this.handleChi(client, msg));
        this.onMessage("pon", (client, msg) => this.handlePon(client, msg));
        this.onMessage("kan", (client, msg) => this.handleKan(client, msg));
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

        // Broadcast player joined
        this.broadcast("playerJoined", { name: player.name, seat: player.seatIndex });
    }

    onLeave(client: Client, consented: boolean) {
        console.log("MahjongRoom left:", client.sessionId);
        const player = this.state.players.get(client.sessionId);

        if (player) {
            if (this.gameStarted) {
                // Convert to CPU if game in progress
                player.isConnected = false;
                player.isCpu = true;
                player.name = `CPU (${player.wind})`;
            } else {
                this.state.players.delete(client.sessionId);
            }
        }

        if (!this.gameStarted && this.state.players.size === 0) {
            this.disconnect();
        }
    }

    handleStartGame(client: Client) {
        if (this.gameStarted) return;
        if (this.state.players.size < this.state.minPlayers) return;

        // Fill remaining seats with CPU
        const currentCount = this.state.players.size;
        for (let i = currentCount; i < 4; i++) {
            const cpuPlayer = new MahjongPlayer();
            cpuPlayer.sessionId = `cpu-${i}`;
            cpuPlayer.name = `CPU ${WINDS[i].charAt(0).toUpperCase() + WINDS[i].slice(1)}`;
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
        // Create and shuffle tiles
        const tiles = this.createAllTiles();
        this.shuffleArray(tiles);

        // Separate dead wall (14 tiles)
        const deadWall = tiles.splice(-14);

        // Set dora indicator
        const doraIndicator = new MahjongTile();
        Object.assign(doraIndicator, deadWall[4]);
        this.state.doraIndicators.push(doraIndicator);

        // Deal 13 tiles to each player
        const players = Array.from(this.state.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
        for (let i = 0; i < 13; i++) {
            for (const player of players) {
                const tile = tiles.shift()!;
                const tileSchema = new MahjongTile();
                Object.assign(tileSchema, tile);
                player.hand.push(tileSchema);
            }
        }

        // Sort hands
        for (const player of players) {
            this.sortHand(player.hand);
        }

        this.state.remainingTiles = tiles.length;
        this.state.currentPlayerIndex = 0;
        this.state.turnCount = 0;

        // First player draws
        this.drawTile(0, tiles);
    }

    private createAllTiles(): any[] {
        const tiles: any[] = [];
        let idCounter = 0;

        // Number tiles
        for (const suit of ["man", "pin", "sou"]) {
            for (let value = 1; value <= 9; value++) {
                for (let copy = 0; copy < 4; copy++) {
                    tiles.push({
                        id: `${suit}${value}-${idCounter++}`,
                        suit,
                        value,
                        isRed: value === 5 && copy === 0
                    });
                }
            }
        }

        // Honor tiles
        for (let value = 1; value <= 7; value++) {
            for (let copy = 0; copy < 4; copy++) {
                tiles.push({
                    id: `honor${value}-${idCounter++}`,
                    suit: "honor",
                    value,
                    isRed: false
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
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }
            return a.value - b.value;
        });
        hand.clear();
        arr.forEach(t => hand.push(t));
    }

    private drawTile(playerIndex: number, tiles?: any[]) {
        // Simplified draw - broadcast state update
        this.state.turnCount++;
        this.state.currentPlayerIndex = playerIndex;
        this.state.lastAction = `draw:${playerIndex}`;

        // Schedule CPU action if needed
        const player = this.getPlayerBySeat(playerIndex);
        if (player?.isCpu) {
            this.scheduleCpuAction(playerIndex);
        }
    }

    private getPlayerBySeat(seatIndex: number): MahjongPlayer | undefined {
        for (const player of this.state.players.values()) {
            if (player.seatIndex === seatIndex) return player;
        }
        return undefined;
    }

    private scheduleCpuAction(seatIndex: number) {
        const timer = setTimeout(() => {
            const player = this.getPlayerBySeat(seatIndex);
            if (!player || !player.isCpu) return;

            // CPU discards last tile
            if (player.hand.length > 0) {
                const tile = player.hand[player.hand.length - 1];
                this.cpuDiscard(player, tile);
            }
        }, 1500);
        this.cpuTimers.push(timer);
    }

    private cpuDiscard(player: MahjongPlayer, tile: MahjongTile) {
        // Remove from hand and add to discards
        const idx = player.hand.findIndex(t => t.id === tile.id);
        if (idx >= 0) {
            player.hand.splice(idx, 1);
            player.discards.push(tile);

            this.state.lastDiscard.clear();
            this.state.lastDiscard.push(tile);
            this.state.lastDiscardPlayer = player.seatIndex;
            this.state.lastAction = `discard:${player.seatIndex}:${tile.id}`;

            // Next player
            this.nextTurn();
        }
    }

    private nextTurn() {
        const nextIndex = (this.state.currentPlayerIndex + 1) % 4;
        this.state.currentPlayerIndex = nextIndex;
        this.state.turnCount++;

        const player = this.getPlayerBySeat(nextIndex);
        if (player?.isCpu) {
            this.scheduleCpuAction(nextIndex);
        }
    }

    handleDiscard(client: Client, msg: { tileId: string }) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (player.seatIndex !== this.state.currentPlayerIndex) return;

        const tileIdx = player.hand.findIndex(t => t.id === msg.tileId);
        if (tileIdx < 0) return;

        const tile = player.hand[tileIdx];
        player.hand.splice(tileIdx, 1);
        player.discards.push(tile);

        this.state.lastDiscard.clear();
        this.state.lastDiscard.push(tile);
        this.state.lastDiscardPlayer = player.seatIndex;
        this.state.lastAction = `discard:${player.seatIndex}:${tile.id}`;

        this.nextTurn();
    }

    handleChi(client: Client, msg: any) {
        // Simplified chi handling
        this.state.lastAction = `chi:${client.sessionId}`;
    }

    handlePon(client: Client, msg: any) {
        this.state.lastAction = `pon:${client.sessionId}`;
    }

    handleKan(client: Client, msg: any) {
        this.state.lastAction = `kan:${client.sessionId}`;
    }

    handleRiichi(client: Client, msg: any) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        player.isRiichi = true;
        this.state.riichiSticks++;
        player.score -= 1000;
    }

    handleTsumo(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        this.state.isGameOver = true;
        this.state.winner = player.seatIndex;
        this.state.winnerName = player.name;
        this.state.phase = "finished";
        this.broadcast("gameOver", { winner: player.name, type: "tsumo" });
    }

    handleRon(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        this.state.isGameOver = true;
        this.state.winner = player.seatIndex;
        this.state.winnerName = player.name;
        this.state.phase = "finished";
        this.broadcast("gameOver", { winner: player.name, type: "ron" });
    }

    handlePass(client: Client) {
        // Pass call opportunity
        this.state.lastAction = `pass:${client.sessionId}`;
    }

    onDispose() {
        this.cpuTimers.forEach(t => clearTimeout(t));
        console.log(`[MahjongRoom] Disposed ${this.roomId}`);
    }
}
