import { Room, Client } from "colyseus";
import { GoState, GoPlayer } from "./schema/GoState";
import { GoBoard, StoneColor } from "../logic/goTypes";
import { createInitialBoard, placeStone } from "../logic/goEngine";

export class GoRoom extends Room<GoState> {
    maxClients = 2;

    // Internal board state (2D) used for logic execution
    internalBoard: GoBoard | null = null;

    onCreate(options: any) {
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.setState(new GoState());

        // Initialize internal board
        this.internalBoard = createInitialBoard(19);
        this.syncState();

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("pass", (client, message) => {
            this.handlePass(client);
        });

        this.onMessage("resign", (client, message) => {
            this.handleResign(client);
        });

        this.onMessage("chat", (client, message) => {
            this.broadcast("chat", message);
        });
    }

    syncState() {
        if (!this.internalBoard) return;

        // Convert 2D grid to 1D ArraySchema
        this.state.grid.clear();
        for (let y = 0; y < this.internalBoard.size; y++) {
            for (let x = 0; x < this.internalBoard.size; x++) {
                const color = this.internalBoard.grid[y][x];
                this.state.grid.push(color || "");
            }
        }

        this.state.turnColor = this.internalBoard.currentColor;
        // Optionally sync scores/captured stones if added to state schema
        // For MVP, we only rely on board state, but let's add captured if needed later
    }

    onJoin(client: Client, options: any) {
        console.log("GoRoom joined:", client.sessionId, options.name);

        const count = this.state.players.size;
        let color = "";

        if (count === 0) {
            color = "black";
        } else if (count === 1) {
            color = "white";
        } else {
            color = "spectator";
        }

        if (color !== "spectator") {
            const player = new GoPlayer();
            player.sessionId = client.sessionId;
            player.name = options.name || "Player";
            player.color = color;
            player.captured = 0;
            this.state.players.set(client.sessionId, player);
        }

        if (this.state.players.size === 2) {
            this.state.phase = "playing";
            this.broadcast("gameStart", { message: "Game Started" });
        }
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);

        // Reversi logic: Dissolve room if ANYONE leaves unless game is naturally finished
        if (this.state.phase !== "finished") {
            this.state.phase = "finished";
            this.state.reason = "player_left";
            this.broadcast("roomDissolved");
            this.disconnect();
        }
    }

    handleMove(client: Client, message: { x: number, y: number }) {
        if (this.state.phase !== "playing") return;

        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        if (!this.internalBoard) return;
        if (player.color !== this.internalBoard.currentColor) return; // Not your turn

        const result = placeStone(this.internalBoard, message.x, message.y);
        if (result.success && result.newBoard) {
            this.internalBoard = result.newBoard;
            this.syncState();

            // Update captured counts
            if (player.color === "black") {
                player.captured = this.internalBoard.capturedBlack; // captured logic might be reversed in types naming vs context, check logic
                // In engine: black player puts stone -> captures white stones -> board.capturedBlack += ... 
                // So black player has captured 'capturedBlack' many opponent stones? OR 'capturedBlack' means Black Stones Captured?
                // Let's check engine.ts: 
                // if (board.currentColor === 'black') nextBoard.capturedWhite += capturedPoints.length; 
                // This implies capturedWhite counts how many WHITE stones are captured (prisoners held by Black).
                // So Black player's score increases by capturedWhite.
                player.captured = this.internalBoard.capturedWhite;
            } else {
                player.captured = this.internalBoard.capturedBlack;
            }
        } else {
            // Invalid move
            client.send("error", { message: "Invalid move" });
        }
    }

    handlePass(client: Client) {
        if (this.state.phase !== "playing") return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !this.internalBoard) return;
        if (player.color !== this.internalBoard.currentColor) return;

        // Switch turn logic only
        const opponent = this.internalBoard.currentColor === 'black' ? 'white' : 'black';
        this.internalBoard.currentColor = opponent;

        // TODO: Check if double pass (game end)
        // Need to track last move type in engine or room

        this.syncState();
    }

    handleResign(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        this.state.phase = "finished";
        this.state.winner = player.color === "black" ? "white" : "black"; // Opponent wins
        this.state.reason = "resignation";
        this.broadcast("gameOver", { winner: this.state.winner, reason: "resignation" });
    }
}
