import { Room, Client } from "colyseus";
import { ChessState, ChessPlayer } from "./schema/ChessState";
import { Chess } from "chess.js";

export class ChessRoom extends Room<ChessState> {
    private chess: Chess;

    onCreate(options: any) {
        // Generate a simple 6-digit Room ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.maxClients = 4; // Headroom for zombies

        console.log(`[ChessRoom] Created! RoomId: ${this.roomId}`, options);
        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.setState(new ChessState());
        this.chess = new Chess();
        this.syncState();

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("resign", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.state.winner = player.color === 'w' ? 'b' : 'w';
                this.state.isGameOver = true;
                this.broadcast("gameOver", { winner: this.state.winner, reason: "resign" });
            }
        });

        this.onMessage("chat", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.broadcast("chat", { id: message.id, sender: player.name, text: message.text, timestamp: Date.now() });
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`[ChessRoom] ${client.sessionId} joining...`);

        // Zombie Purge
        const activeIds = new Set(this.clients.map(c => c.sessionId));
        const toRemove: string[] = [];
        this.state.players.forEach((p, key) => {
            if (!activeIds.has(key)) toRemove.push(key);
        });
        toRemove.forEach(key => this.state.players.delete(key));

        // Determine Role based on existing roles (more robust than count)
        let hasWhite = false;
        let hasBlack = false;
        this.state.players.forEach(p => {
            if (p.color === 'w') hasWhite = true;
            if (p.color === 'b') hasBlack = true;
        });

        let role = 'spectator';
        if (!hasWhite) {
            role = 'w';
        } else if (!hasBlack) {
            role = 'b';
        }

        const player = new ChessPlayer();
        player.id = client.sessionId;
        player.name = options.name || "Player";
        player.color = role;
        this.state.players.set(client.sessionId, player);

        console.log(`[ChessRoom] Added player ${player.name} as ${role}`);

        if (hasWhite && role === 'b' || hasBlack && role === 'w') {
            // Both roles filled
            this.lock();
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`[ChessRoom] ${client.sessionId} left`);
        const player = this.state.players.get(client.sessionId);
        if (player) {
            // If game is in progress, maybe handle disconnect logic?
            // For now, simple removal or mark as disconnected
            this.state.players.delete(client.sessionId);
        }
        // Always unlock to ensure room is accessible if under capacity
        // Note: maxClients still enforces limit, but this clears manual lock
        this.unlock();
    }

    handleMove(client: Client, moveData: { from: string, to: string, promotion?: string }) {
        if (this.state.isGameOver) return;

        const player = this.state.players.get(client.sessionId);
        if (!player || player.color === 'spectator') return;

        // Verify turn
        if ((this.chess.turn() === 'w' && player.color !== 'w') ||
            (this.chess.turn() === 'b' && player.color !== 'b')) {
            console.log("Not your turn!");
            return;
        }

        try {
            const move = this.chess.move({
                from: moveData.from,
                to: moveData.to,
                promotion: moveData.promotion || 'q' // default to queen for simplicity if not specified
            });

            if (move) {
                // Update State
                this.syncState();
                this.state.lastMove = JSON.stringify({ from: move.from, to: move.to });

                // Check Game Over
                if (this.chess.isGameOver()) {
                    this.state.isGameOver = true;
                    if (this.chess.isCheckmate()) {
                        this.state.winner = this.chess.turn() === 'w' ? 'b' : 'w'; // The one WHOSE TURN IT IS lost
                    } else if (this.chess.isDraw()) {
                        this.state.winner = "draw";
                    }
                    this.broadcast("gameOver", { winner: this.state.winner });
                }
            }
        } catch (e) {
            console.log("Invalid move", e);
        }
    }

    syncState() {
        this.state.fen = this.chess.fen();
        this.state.turn = this.chess.turn();
        this.state.isCheck = this.chess.isCheck();
    }
}
