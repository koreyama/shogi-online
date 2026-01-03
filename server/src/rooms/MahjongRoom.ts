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
        this.onMessage("nextRound", (client) => this.handleNextRound(client));
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
        player.discards.push(tile); // Add to discard pile immediately

        // Sort hand after discard to keep it tidy
        this.sortHand(player.hand);

        this.state.lastDiscard.clear();
        this.state.lastDiscard.push(tile);
        this.state.lastDiscardPlayer = player.seatIndex;
        this.state.lastAction = `discard:${player.seatIndex}:${tile.id}`;


        // Check for Ron/Pon/Chi opportunities before moving to next turn
        this.checkCallOpportunities(tile, player.seatIndex);
    }

    private checkCallOpportunities(tile: MahjongTile, discarderSeat: number) {
        let hasOpportunity = false;

        // 1. Check Pon/Kan (Any other player)
        this.state.players.forEach((p) => {
            if (p.seatIndex === discarderSeat) return;

            // Pon Check (2 matching)
            const count = p.hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
            if (count >= 2) {
                this.state.canCall[p.seatIndex] = true;
                hasOpportunity = true;
            }

            // Ron Check (Simplified: Matches winning tile? Logic is complex, skipping for now unless in Tenpai)
            // For MVP, enable 'Ron' button if it completes a pair/sequence? 
            // Better to rely on a 'checkWin' helper, but for now let's assume NO Ron unless explicitly implemented.
        });

        // 2. Check Chi (Only next player)
        const nextSeat = (discarderSeat + 1) % 4;
        const nextPlayer = this.getPlayerBySeat(nextSeat);
        if (nextPlayer) {
            // Check for sequences involving tile.value
            // e.g. (v-2, v-1), (v-1, v+1), (v+1, v+2)
            const v = tile.value;
            const s = tile.suit;
            const h = nextPlayer.hand;

            // Helper to find
            const has = (val: number) => h.some(t => t.suit === s && t.value === val);

            if (s !== 'honor') { // honors cannot chi
                if ((has(v - 2) && has(v - 1)) || (has(v - 1) && has(v + 1)) || (has(v + 1) && has(v + 2))) {
                    this.state.canCall[nextSeat] = true;
                    hasOpportunity = true;
                }
            }
        }

        if (hasOpportunity) {
            this.state.phase = "calling";

            // Set timeout for auto-pass if no action (e.g. 5 seconds)
            const timer = setTimeout(() => {
                this.finishCallPhase();
            }, 5000); // 5 sec to call
            this.cpuTimers.push(timer);

        } else {
            // No calls possible, proceed to next turn
            this.nextTurn();
        }
    }



    private finishCallPhase() {
        // Clear timer if any
        this.cpuTimers.forEach(t => clearTimeout(t));
        this.cpuTimers = [];

        // Check if anyone declared an action? 
        // This function implies "Time is up, nobody acted".
        this.state.phase = "playing";
        for (let i = 0; i < 4; i++) {
            this.state.canCall[i] = false;
            this.state.canRon[i] = false;
        }
        this.nextTurn();
    }

    handlePon(client: Client, msg: any) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !this.state.canCall[player.seatIndex]) return;

        const discard = this.state.lastDiscard[0];
        // 1. Remove 2 matching tiles from hand
        const matches = player.hand.filter(t => t.suit === discard.suit && t.value === discard.value);
        if (matches.length < 2) return;

        // Perform Pon
        this.performCall(player, 'pon', [discard, matches[0], matches[1]]);
    }

    handleChi(client: Client, msg: { tiles: string[] }) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !this.state.canCall[player.seatIndex]) return;

        // Next player check
        if (player.seatIndex !== (this.state.lastDiscardPlayer + 1) % 4) return;

        // Validate tiles exist in hand
        // msg.tiles should contain IDs of the 2 tiles in hand to consume
        // logic skipped for brevity, assuming valid for now or strictly implementing:

        // Simple fallback: Auto-find stats (unsafe but works for quick prototype)
        const discard = this.state.lastDiscard[0];
        // ... Logic to extract actual tiles ...

        // For MVP: Just finding appropriate sequence neighbors
        const v = discard.value;
        const neighbors = player.hand.filter(t => t.suit === discard.suit && Math.abs(t.value - v) <= 2 && t.value !== v);
        // Take first 2 distinct that make a sequence.
        // This is complex! Client should send IDs.

        // Let's assume msg.tileIds? If not, we block Chi for this step or auto-pick.
        // Auto-pick first valid sequence:
        let picked: MahjongTile[] = [];
        // (v-1, v+1)
        const m1 = player.hand.find(t => t.suit === discard.suit && t.value === v - 1);
        const p1 = player.hand.find(t => t.suit === discard.suit && t.value === v + 1);
        if (m1 && p1) picked = [m1, p1];

        if (picked.length === 2) {
            this.performCall(player, 'chi', [discard, picked[0], picked[1]]);
        }
    }

    handleKan(client: Client, msg: any) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        // ... Similar Pon logic but 3 tiles ...
    }

    handlePass(client: Client) {
        if (this.state.phase !== "calling") return;
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        // Player explicitly passed
        this.state.canCall[player.seatIndex] = false;
        this.state.canRon[player.seatIndex] = false;

        // Check if everyone passed?
        // In simple logic: if *I* was the one stopping the game, and I passed, initiate resume.
        // Multiplayer: wait for ALL eligible? 
        // Simplified: If just 1 person can call, passing resumes immediately.
        // If multiple, wait for all.

        const anyoneCanStillCall = Array.from(this.state.canCall).some(b => b);
        if (!anyoneCanStillCall) {
            this.finishCallPhase();
        }
    }

    private performCall(player: MahjongPlayer, type: string, tiles: MahjongTile[]) {
        // Clear timeout
        this.cpuTimers.forEach(t => clearTimeout(t));
        this.cpuTimers = [];

        // Move tiles from hand/discard to 'calls'
        const discardObj = tiles[0]; // From discard pile
        // Remove from hand (tiles[1], tiles[2]...)
        for (let i = 1; i < tiles.length; i++) {
            const idx = player.hand.findIndex(t => t.id === tiles[i].id);
            if (idx !== -1) player.hand.splice(idx, 1);
        }

        // Add call object
        const call = new MahjongCall();
        call.callType = type;
        call.fromPlayer = this.state.lastDiscardPlayer;
        tiles.forEach(t => call.tiles.push(t));
        player.calls.push(call);

        // Turn moves to this player
        this.state.currentPlayerIndex = player.seatIndex;
        this.state.phase = "playing";
        this.state.lastAction = `${type}:${player.seatIndex}`;

        // Reset flags
        for (let i = 0; i < 4; i++) { this.state.canCall[i] = false; this.state.canRon[i] = false; }

        // After calling, player must discard immediately (cannot draw)
        // Unless it is a Kan (draw replacement).
        // Standard Pon/Chi -> Discard only.
        // We set state phase to 'playing' but skipping 'drawTile'.
        // The client must know to Discard next.
    }

    handleRiichi(client: Client, msg: any) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        player.isRiichi = true;
        this.state.riichiSticks++;
        player.score -= 1000;
        this.broadcast("riichi", { seat: player.seatIndex });
    }

    handleTsumo(client: Client) {
        // Validate turn
        const player = this.state.players.get(client.sessionId);
        if (!player || player.seatIndex !== this.state.currentPlayerIndex) return;

        this.state.isGameOver = true;
        this.state.winner = player.seatIndex;
        this.state.winnerName = player.name;
        this.state.phase = "finished";
        this.broadcast("gameOver", { winner: player.name, type: "tsumo" });
    }

    handleRon(client: Client) {
        const player = this.state.players.get(client.sessionId);
        // ... Validate if canRon
        if (!player) return;

        this.state.isGameOver = true;
        this.state.winner = player.seatIndex;
        this.state.winnerName = player.name;
        this.state.phase = "finished";
        this.broadcast("gameOver", { winner: player.name, type: "ron" });
    }

    handleNextRound(client: Client) {
        if (this.state.phase !== "finished") return;

        // Simple consensus: If host (or winner?) clicks next, we go next.
        // Ideally wait for all, but for now let's trust the request.

        // Advance round
        // Logic: 
        // If dealer won (renchan), repeat round.
        // Else, move to next round.
        // For MVP: maximize simplicity -> Always standard rotation or simple increment?
        // Let's implement standard:
        // Current dealer = (roundNumber - 1) % 4 (relative to East?). 
        // Actually we stored `state.roundWind` and `state.roundNumber`.

        // Let's just blindly increment for now to ensure flow works.
        // We need a way to clear the board.

        this.cleanupBoard();
        this.state.roundNumber++;
        if (this.state.roundNumber > 4) {
            this.state.roundNumber = 1;
            // Rotate wind
            const wIdx = WINDS.indexOf(this.state.roundWind);
            this.state.roundWind = WINDS[(wIdx + 1) % 4];
        }

        // Reset Phase
        this.state.phase = "playing";
        this.state.isGameOver = false;
        this.state.winner = -1;
        this.state.winnerName = "";

        // Deal new hand
        this.initializeGame();

        this.broadcast("gameStart", { message: "Next round started!" });
    }

    private cleanupBoard() {
        this.state.doraIndicators.clear();
        this.state.lastDiscard.clear();
        this.state.canCall.clear();
        this.state.canRon.clear();
        // Reset flags for size 4
        for (let i = 0; i < 4; i++) { this.state.canCall.push(false); this.state.canRon.push(false); }

        this.state.players.forEach(p => {
            p.hand.clear();
            p.discards.clear();
            p.calls.clear();
            p.isRiichi = false;
            // DO NOT reset score
            p.score = p.score;
        });
    }

    onDispose() {
        this.cpuTimers.forEach(t => clearTimeout(t));
        console.log(`[MahjongRoom] Disposed ${this.roomId}`);
    }
}
