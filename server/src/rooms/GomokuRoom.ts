import { Room, Client } from "colyseus";
import { GomokuState, GomokuPlayer } from "./schema/GomokuState";

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

export class GomokuRoom extends Room<GomokuState> {
    maxClients = 2;

    onCreate(options: any) {
        this.setState(new GomokuState());

        // Generate a simple 6-digit Room ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("resign", (client, message) => {
            this.handleResign(client);
        });

        this.onMessage("chat", (client, message) => {
            this.broadcast("chat", message);
        });

        console.log(`[GomokuRoom] Created ${this.roomId}`);
    }

    onJoin(client: Client, options: any) {
        console.log("GomokuRoom joined:", client.sessionId, options.name);

        const count = this.state.players.size;
        let color = "";

        if (count === 0) {
            color = "black"; // First is Black
        } else if (count === 1) {
            color = "white"; // Second is White
        } else {
            color = "spectator";
        }

        if (color !== "spectator") {
            const player = new GomokuPlayer(client.sessionId, options.name || "Player", color);
            this.state.players.set(client.sessionId, player);
        }

        if (this.state.players.size === 2) {
            this.broadcast("gameStart", { message: "Game Started" });
            this.lock(); // Optional: lock room when full? Or keep open for spectators if supported later.
            // But usually we lock to prevent 3rd player trying to sit.
            // Logic below handles spectators, so locking isn't strictly required but good for "Room Match" UX.
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log("GomokuRoom left:", client.sessionId);
        const player = this.state.players.get(client.sessionId);
        if (player) {
            this.state.players.delete(client.sessionId);
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
        if (player.color !== this.state.turn) return;

        const x = message.x;
        const y = message.y;
        const index = y * BOARD_SIZE + x;

        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
        if (this.state.board[index] !== EMPTY) return;

        const colorCode = player.color === "black" ? BLACK : WHITE;
        this.state.board[index] = colorCode;
        this.state.lastMove = `${String.fromCharCode(97 + x)}${y + 1}`; // e.g. "h8"

        if (this.checkWin(x, y, colorCode)) {
            this.state.isGameOver = true;
            this.state.winner = player.color;
            this.broadcast("gameOver", { winner: this.state.winner, reason: "connect5" });
        } else if (this.checkDraw()) {
            this.state.isGameOver = true;
            this.state.winner = "draw";
            this.broadcast("gameOver", { winner: "draw", reason: "full" });
        } else {
            this.state.turn = this.state.turn === "black" ? "white" : "black";
        }
    }

    handleResign(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        this.state.isGameOver = true;
        this.state.winner = player.color === "black" ? "white" : "black";
        this.broadcast("gameOver", { winner: this.state.winner, reason: "resignation" });
    }

    checkWin(x: number, y: number, color: number): boolean {
        const directions = [
            [1, 0],  // Horizontal
            [0, 1],  // Vertical
            [1, 1],  // Diagonal \
            [1, -1]  // Diagonal /
        ];

        for (const [dx, dy] of directions) {
            let count = 1;

            // Check forward
            let cx = x + dx;
            let cy = y + dy;
            while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && this.state.board[cy * BOARD_SIZE + cx] === color) {
                count++;
                cx += dx;
                cy += dy;
            }

            // Check backward
            cx = x - dx;
            cy = y - dy;
            while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && this.state.board[cy * BOARD_SIZE + cx] === color) {
                count++;
                cx -= dx;
                cy -= dy;
            }

            if (count >= 5) return true;
        }
        return false;
    }

    checkDraw(): boolean {
        // Technically strict logic is full board.
        return this.state.board.every(cell => cell !== EMPTY);
    }
}
