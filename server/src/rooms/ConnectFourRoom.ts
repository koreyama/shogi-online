import { Room, Client } from "colyseus";
import { ConnectFourState, ConnectFourPlayer } from "./schema/ConnectFourState";

const COLS = 7;
const ROWS = 6;

export class ConnectFourRoom extends Room<ConnectFourState> {
    maxClients = 2;

    onCreate(options: any) {
        console.log("ConnectFourRoom created!", options);
        // Custom 6-digit numeric ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        this.setState(new ConnectFourState());

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        // Handle move: client sends { col: number }
        this.onMessage("move", (client, message) => {
            if (!this.state.gameStarted || this.state.winner || this.state.isDraw) return;

            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;

            const col = message.col;
            if (col < 0 || col >= COLS) return;

            // Log logic
            // Find the lowest empty row in this column
            // Index = row * COLS + col
            // Row 0 is top, Row 5 is bottom? Usually standard is 0 top.
            // Let's check logic. If 0 is top, gravity means fill from 5 upwards.

            let targetRow = -1;
            for (let r = ROWS - 1; r >= 0; r--) {
                const idx = r * COLS + col;
                if (this.state.board[idx] === 0) {
                    targetRow = r;
                    break;
                }
            }

            if (targetRow === -1) return; // Column full

            const idx = targetRow * COLS + col;
            const colorCode = this.state.turn === "red" ? 1 : 2;
            this.state.board[idx] = colorCode;
            this.state.lastMoveCol = col;
            this.state.lastMoveRow = targetRow;

            if (this.checkWin(targetRow, col, colorCode)) {
                this.state.winner = this.state.turn;
                this.broadcast("gameOver", { winner: this.state.turn });
            } else if (this.checkDraw()) {
                this.state.isDraw = true;
                this.broadcast("gameOver", { result: "draw" });
            } else {
                this.state.turn = this.state.turn === "red" ? "yellow" : "red";
            }
        });

        this.onMessage("restart", (client) => {
            // Optional: Handle restart
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined ConnectFour!");

        let role = "spectator";
        if (this.clients.length === 1) {
            role = "red";
        } else if (this.clients.length === 2) {
            role = "yellow";
        }

        if (role !== "spectator") {
            const player = new ConnectFourPlayer(client.sessionId, options.name || "Player", role);
            this.state.players.set(client.sessionId, player);
        }

        if (this.state.players.size === 2) {
            this.state.gameStarted = true;
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left ConnectFour!");
        this.state.players.delete(client.sessionId);
        if (this.state.gameStarted && !this.state.winner && !this.state.isDraw) {
            // Opponent left
            this.broadcast("roomDissolved");
            this.disconnect();
        }
    }

    onDispose() {
        console.log("room disposed!");
    }

    checkWin(row: number, col: number, color: number): boolean {
        const board = this.state.board;
        // Directions: [dr, dc]
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal \
            [1, -1]  // Diagonal /
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            // Check Forward
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === color) {
                count++;
                r += dr;
                c += dc;
            }

            // Check Backward
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === color) {
                count++;
                r -= dr;
                c -= dc;
            }

            if (count >= 4) return true;
        }
        return false;
    }

    checkDraw(): boolean {
        // If board is full (no 0s)
        for (let i = 0; i < this.state.board.length; i++) {
            if (this.state.board[i] === 0) return false;
        }
        return true;
    }
}
