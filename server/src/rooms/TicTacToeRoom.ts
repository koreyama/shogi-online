import { Room, Client } from "colyseus";
import { TicTacToeState, TicTacToePlayer } from "./schema/TicTacToeState";

const BOARD_SIZE = 3;
const EMPTY = 0;
const O_MARK = 1; // First player
const X_MARK = 2; // Second player

export class TicTacToeRoom extends Room<TicTacToeState> {
    maxClients = 2;

    onCreate(options: any) {
        this.setState(new TicTacToeState());

        // Initial board setup (already handled by default ArraySchema values in State?)
        // ArraySchema defaults to empty if not filled. Let's fill it.
        for (let i = 0; i < 9; i++) {
            this.state.board[i] = EMPTY;
        }

        // Generate a 6-digit Room ID if not provided (though Colyseus usually handles roomId)
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("reset", (client, message) => {
            // Optional: Allow reset? Usually we just start next game or rely on client to re-join.
            // For simplicity, let's allow a reset vote or simple reset if game over.
            if (this.state.isGameOver) {
                this.resetGame();
                this.broadcast("gameRestarted");
            }
        });

        this.onMessage("chat", (client, message) => {
            this.broadcast("chat", message);
        });

        console.log(`[TicTacToeRoom] Created ${this.roomId}`);
    }

    onJoin(client: Client, options: any) {
        console.log("TicTacToeRoom joined:", client.sessionId, options.name);

        const count = this.state.players.size;
        let mark = "";

        if (count === 0) {
            mark = "o"; // First player is O (First move)
        } else if (count === 1) {
            mark = "x"; // Second player is X
        } else {
            // Spectator
            return;
        }

        const player = new TicTacToePlayer(client.sessionId, options.name || "Guest", mark);
        this.state.players.set(client.sessionId, player);

        if (this.state.players.size === 2) {
            this.broadcast("gameStart", { message: "Game Started" });
        }
    }

    onLeave(client: Client, consented: boolean) {
        if (this.state.players.has(client.sessionId)) {
            this.state.players.delete(client.sessionId);
            if (!this.state.isGameOver) {
                // If game is in progress and player leaves, other wins or room closes
                this.broadcast("roomDissolved", { leaver: client.sessionId });
                this.disconnect();
            }
        }
    }

    handleMove(client: Client, message: { index: number }) {
        if (this.state.isGameOver) return;
        if (this.state.players.size < 2) return;

        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (player.mark !== this.state.turn) return;

        const index = message.index;
        if (index < 0 || index >= 9) return;
        if (this.state.board[index] !== EMPTY) return;

        const markCode = player.mark === "o" ? O_MARK : X_MARK;
        this.state.board[index] = markCode;

        if (this.checkWin(player.mark)) {
            this.state.isGameOver = true;
            this.state.winner = player.mark;
            this.broadcast("gameOver", { winner: this.state.winner, reason: "win" });
        } else if (this.checkDraw()) {
            this.state.isGameOver = true;
            this.state.winner = "draw";
            this.broadcast("gameOver", { winner: "draw", reason: "draw" });
        } else {
            this.state.turn = this.state.turn === "o" ? "x" : "o";
        }
    }

    resetGame() {
        for (let i = 0; i < 9; i++) {
            this.state.board[i] = EMPTY;
        }
        this.state.turn = "o";
        this.state.isGameOver = false;
        this.state.winner = "";
    }

    checkWin(mark: string): boolean {
        const b = this.state.board;
        const m = mark === "o" ? O_MARK : X_MARK;

        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        return wins.some(pattern =>
            pattern.every(idx => b[idx] === m)
        );
    }

    checkDraw(): boolean {
        return this.state.board.every(cell => cell !== EMPTY);
    }
}
