import { Room, Client } from "colyseus";
import { ReversiState, ReversiPlayer } from "./schema/ReversiState";

const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

export class ReversiRoom extends Room<ReversiState> {
    maxClients = 2;

    onCreate(options: any) {
        // Generate a simple 6-digit Room ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.setState(new ReversiState());

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("resign", (client, message) => {
            this.handleResign(client);
        });

        this.onMessage("chat", (client, message) => {
            this.broadcast("chat", message);
        });
    }

    onJoin(client: Client, options: any) {
        console.log("ReversiRoom joined:", client.sessionId, options.name);

        const count = this.state.players.size;
        let color = "";

        if (count === 0) {
            color = "black"; // First player is Black
        } else if (count === 1) {
            color = "white"; // Second player is White
        } else {
            // Spectator
            color = "spectator";
        }

        if (color !== "spectator") {
            const player = new ReversiPlayer(client.sessionId, options.name || "Player", color);
            this.state.players.set(client.sessionId, player);
        }

        if (this.state.players.size === 2) {
            this.broadcast("gameStart", { message: "Game Started" });
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log("ReversiRoom left:", client.sessionId);
        const player = this.state.players.get(client.sessionId);
        if (player) {
            this.state.players.delete(client.sessionId);
            // If game was in progress, remaining player wins? 
            // For now, just broadcast dissolution similar to Shogi/Chess
            if (!this.state.isGameOver && this.state.players.size < 2) {
                this.broadcast("roomDissolved", { leaver: client.sessionId });
                this.disconnect();
            }
        }
    }

    handleMove(client: Client, message: { x: number, y: number }) {
        if (this.state.isGameOver) return;
        if (this.state.players.size < 2) return;

        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (player.color !== this.state.turn) return; // Not your turn

        const x = message.x;
        const y = message.y;
        const index = y * BOARD_SIZE + x;

        // Basic validation
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
        if (this.state.board[index] !== EMPTY) return; // Must be empty

        // Calculate Flips
        const colorCode = player.color === "black" ? BLACK : WHITE;
        const flips = this.getFlips(this.state.board, x, y, colorCode);

        if (flips.length === 0) return; // Must flip at least one

        // Execute Move
        this.state.board[index] = colorCode;
        flips.forEach(idx => {
            this.state.board[idx] = colorCode;
        });

        // Update counts
        this.updateCounts();
        this.state.lastMove = `${String.fromCharCode(97 + x)}${y + 1}`; // e.g., c4

        // Next Turn Logic
        const opponentColor = this.state.turn === "black" ? "white" : "black";

        // Check if opponent can move
        if (this.canMove(opponentColor)) {
            this.state.turn = opponentColor;
        } else {
            // Opponent passes. Check if CURRENT player can move (double turn)
            if (this.canMove(this.state.turn)) {
                // Keep turn, broadcast Pass
                this.broadcast("pass", { player: opponentColor });
            } else {
                // Neither can move -> Game Over
                this.endGame();
            }
        }

        // Also check if board is full (canMove checks valid moves, but explicit full check is safe too)
        if (this.state.blackCount + this.state.whiteCount === 64) {
            this.endGame();
        }
    }

    handleResign(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        this.state.isGameOver = true;
        this.state.winner = player.color === "black" ? "white" : "black"; // Opponent wins
        this.broadcast("gameOver", { winner: this.state.winner, reason: "resignation" });
    }

    getFlips(board: any, x: number, y: number, color: number): number[] {
        const flips: number[] = [];
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ];
        const opponent = color === BLACK ? WHITE : BLACK;

        for (const [dx, dy] of directions) {
            let cx = x + dx;
            let cy = y + dy;
            const potentialFlips: number[] = [];

            while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
                const idx = cy * BOARD_SIZE + cx;
                const cell = board[idx];

                if (cell === opponent) {
                    potentialFlips.push(idx);
                } else if (cell === color) {
                    // Valid sandwich
                    if (potentialFlips.length > 0) {
                        flips.push(...potentialFlips);
                    }
                    break;
                } else {
                    // Empty cell
                    break;
                }

                cx += dx;
                cy += dy;
            }
        }
        return flips;
    }

    canMove(colorStr: string): boolean {
        const color = colorStr === "black" ? BLACK : WHITE;
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const idx = y * BOARD_SIZE + x;
                if (this.state.board[idx] === EMPTY) {
                    if (this.getFlips(this.state.board, x, y, color).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    updateCounts() {
        let b = 0;
        let w = 0;
        this.state.board.forEach(cell => {
            if (cell === BLACK) b++;
            if (cell === WHITE) w++;
        });
        this.state.blackCount = b;
        this.state.whiteCount = w;
    }

    endGame() {
        this.state.isGameOver = true;
        if (this.state.blackCount > this.state.whiteCount) {
            this.state.winner = "black";
        } else if (this.state.whiteCount > this.state.blackCount) {
            this.state.winner = "white";
        } else {
            this.state.winner = "draw";
        }
        this.broadcast("gameOver", { winner: this.state.winner });
    }
}
