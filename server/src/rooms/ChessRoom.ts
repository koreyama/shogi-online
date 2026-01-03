import { Room, Client } from "colyseus";
import { ChessState, ChessPlayer } from "./schema/ChessState";

export class ChessRoom extends Room<ChessState> {
    private chess: any;

    async onCreate(options: any) {
        // Generate a simple 6-digit Room ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        // Allow some headroom for zombies (cleaned up in onJoin)
        this.maxClients = 4;

        console.log(`[ChessRoom] Created! RoomId: ${this.roomId}`, options);
        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.setState(new ChessState());

        console.log("[ChessRoom] Initializing Chess engine (Async)...");
        try {
            // Dynamic import for ESM compatibility
            // chess.js v1+ is ESM-only, this allows CJS server to load it
            const module = await import("chess.js");
            const ChessCtor = module.Chess || (module as any).default;
            this.chess = new ChessCtor();
            console.log("[ChessRoom] Chess engine initialized.");

            // Initial sync
            this.syncState();
        } catch (e) {
            console.error("[ChessRoom] FAILED to load chess.js:", e);
        }

        // --- Event Handlers ---

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("resign", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && (player.color === 'w' || player.color === 'b')) {
                const winner = player.color === 'w' ? 'b' : 'w';
                this.state.winner = winner;
                this.state.isGameOver = true;
                this.broadcast("gameOver", { winner, reason: "resign" });
            }
        });

        this.onMessage("chat", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.broadcast("chat", {
                    id: message.id,
                    sender: player.name,
                    text: message.text,
                    timestamp: Date.now()
                });
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`[ChessRoom] ${client.sessionId} joining...`);

        // 1. Zombie Purge (Match Shogi Logic)
        // Remove valid players from state if they are NOT in the current connecting clients list
        const activeIds = new Set(this.clients.map(c => c.sessionId));
        const toRemove: string[] = [];
        this.state.players.forEach((p, key) => {
            if (!activeIds.has(key)) {
                toRemove.push(key);
            }
        });
        toRemove.forEach(key => {
            console.log(`[ZombiePurge] Removing ghost ${key}`);
            this.state.players.delete(key);
        });

        // 2. Role Assignment
        let hasWhite = false;
        let hasBlack = false;
        this.state.players.forEach(p => {
            if (p.color === 'w') hasWhite = true;
            if (p.color === 'b') hasBlack = true;
        });

        const player = new ChessPlayer();
        player.id = client.sessionId;
        player.name = options.name || `Player ${this.clients.length}`;

        if (!hasWhite) {
            player.color = 'w';
        } else if (!hasBlack) {
            player.color = 'b';
        } else {
            player.color = 'spectator';
        }

        this.state.players.set(client.sessionId, player);
        console.log(`[ChessRoom] Assigned ${player.color} to ${client.sessionId}`);

        // 3. Check Start / Lock
        // Re-check roles after assignment
        hasWhite = false;
        hasBlack = false;
        this.state.players.forEach(p => {
            if (p.color === 'w') hasWhite = true;
            if (p.color === 'b') hasBlack = true;
        });

        if (hasWhite && hasBlack) {
            console.log("[GameStart] Both roles filled. Locking room.");
            this.lock();
            // Optional: broadcast game start if needed, but UI usually reacts to player presence
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`[ChessRoom] ${client.sessionId} left`);
        const player = this.state.players.get(client.sessionId);

        const isParticipant = player && (player.color === 'w' || player.color === 'b');

        this.state.players.delete(client.sessionId);

        if (isParticipant) {
            console.log("[RoomDissolved] Participant left. End game/room.");
            // Notify remaining clients
            this.broadcast("roomDissolved", { reason: "Opponent disconnected" });
            this.unlock();

            // Disconnect others after delay
            this.clock.setTimeout(() => {
                this.clients.forEach(c => {
                    if (c.sessionId !== client.sessionId) c.leave();
                });
            }, 500);
        }
    }

    handleMove(client: Client, moveData: { from: string, to: string, promotion?: string }) {
        if (!this.chess) return;
        if (this.state.isGameOver) return;

        const player = this.state.players.get(client.sessionId);
        if (!player || player.color === 'spectator') return;

        // Verify turn
        const currentTurn = this.chess.turn(); // 'w' or 'b'
        if (currentTurn !== player.color) {
            return; // Not your turn
        }

        try {
            const move = this.chess.move({
                from: moveData.from,
                to: moveData.to,
                promotion: moveData.promotion || 'q'
            });

            if (move) {
                // Update State
                this.syncState();
                this.state.lastMove = JSON.stringify({ from: move.from, to: move.to });

                // Check Game Over
                if (this.chess.isGameOver()) {
                    this.state.isGameOver = true;
                    if (this.chess.isCheckmate()) {
                        this.state.winner = currentTurn === 'w' ? 'b' : 'w'; // Previous turn player lost
                    } else if (this.chess.isDraw() || this.chess.isStalemate() || this.chess.isThreefoldRepetition()) {
                        this.state.winner = "draw";
                    } else {
                        this.state.winner = "draw"; // Fifty move rule, insufficiency, etc.
                    }
                    this.broadcast("gameOver", { winner: this.state.winner });
                }
            }
        } catch (e) {
            console.log("Invalid move attempt", e);
        }
    }

    syncState() {
        if (!this.chess) return;
        this.state.fen = this.chess.fen();
        this.state.turn = this.chess.turn();
        this.state.isCheck = this.chess.isCheck();
    }
}
