import { Room, Client } from "colyseus";
import { HoneycombState, HoneycombPlayer } from "./schema/HoneycombState";

const BOARD_RADIUS = 7;

// Helper to get key
const getHexKey = (q: number, r: number, s: number) => `${q},${r},${s}`;

export class HoneycombRoom extends Room<HoneycombState> {
    maxClients = 2;

    onCreate(options: any) {
        this.setState(new HoneycombState());

        // 6-digit numeric ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.onMessage("chat", (client, message: any) => {
            this.broadcast("chat", message);
        });

        this.onMessage("move", (client, message: { q: number, r: number, s: number }) => {
            if (!this.state.gameStarted || this.state.winner !== 0) return;

            // Find player role
            const playerIndex = this.clients.indexOf(client);
            // Player 1 (Blue) is index 0? Needs robust role tracking. 
            // We usually store player mapping. 
            // Reuse previous pattern: store players in state? Or just trust client index?
            // "client.sessionId" mapping is safer.
            const role = this.getPlayerRole(client.sessionId);
            if (!role || role !== this.state.turn) return;

            const { q, r, s } = message;
            const key = getHexKey(q, r, s);

            // Validate move
            if (this.state.board.has(key)) return; // Occupied
            if (!this.isValidHex(q, r, s)) return; // Out of bounds

            // Apply move
            this.state.board.set(key, role);

            // Check Win/Loss
            const result = this.checkWinLoss(q, r, s, role);
            if (result.won) {
                this.state.winner = role;
                this.state.winReason = "4-in-row";
                result.line.forEach(k => this.state.winningLine.push(k));
                this.broadcast("gameOver", { winner: role, reason: "4-in-row" });
            } else if (result.lost) {
                // If I lost (3 in a row), opponent wins
                const opponent = role === 1 ? 2 : 1;
                this.state.winner = opponent;
                this.state.winReason = "3-in-row"; // The mover lost due to 3-in-row
                // Show the 3-in-row line as significant? Or the opponent's?
                result.line.forEach(k => this.state.winningLine.push(k));
                this.broadcast("gameOver", { winner: opponent, reason: "3-in-row" });
            } else {
                // Switch turn
                this.state.turn = this.state.turn === 1 ? 2 : 1;
            }
        });
    }

    // Role mapping: sessionId -> 1 or 2
    playerRoles: { [id: string]: number } = {};

    onJoin(client: Client, options: any) {
        // Assign role
        const count = this.clients.length;
        let role = 0;
        if (count === 1) {
            role = 1;
            this.playerRoles[client.sessionId] = 1; // First is P1 (Blue)
        } else if (count === 2) {
            role = 2;
            this.playerRoles[client.sessionId] = 2; // Second is P2 (Red)
        }

        // Store in state
        const player = new HoneycombPlayer();
        player.id = client.sessionId;
        player.name = options.name || "Player";
        player.role = role;
        this.state.players.set(client.sessionId, player);

        if (count === 2) {
            this.state.gameStarted = true;
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        delete this.playerRoles[client.sessionId];
        this.state.players.delete(client.sessionId);
        if (this.state.gameStarted && this.state.winner === 0) {
            this.broadcast("roomDissolved");
            this.disconnect();
        }
    }

    getPlayerRole(sessionId: string): number | null {
        return this.playerRoles[sessionId] || null;
    }

    isValidHex(q: number, r: number, s: number) {
        return Math.abs(q) <= BOARD_RADIUS && Math.abs(r) <= BOARD_RADIUS && Math.abs(s) <= BOARD_RADIUS && (q + r + s === 0);
    }

    checkWinLoss(q: number, r: number, s: number, player: number) {
        const board = this.state.board;
        const axes = [
            { q: 1, r: 0, s: -1 },
            { q: 0, r: 1, s: -1 },
            { q: 1, r: -1, s: 0 }
        ];

        let won = false;
        let lost = false;
        let winLine: string[] = [];

        // Temporarily construct the check.
        // We need to iterate axes.
        for (const axis of axes) {
            let count = 1;
            let line = [getHexKey(q, r, s)];

            // Forward
            let currQ = q + axis.q;
            let currR = r + axis.r;
            let currS = s + axis.s;
            while (board.get(getHexKey(currQ, currR, currS)) === player) {
                count++;
                line.push(getHexKey(currQ, currR, currS));
                currQ += axis.q;
                currR += axis.r;
                currS += axis.s;
            }

            // Backward
            currQ = q - axis.q;
            currR = r - axis.r;
            currS = s - axis.s;
            while (board.get(getHexKey(currQ, currR, currS)) === player) {
                count++;
                line.push(getHexKey(currQ, currR, currS));
                currQ -= axis.q;
                currR -= axis.r;
                currS -= axis.s;
            }

            if (count >= 4) {
                won = true;
                winLine = line;
                break; // Win overrides
            } else if (count === 3) {
                lost = true;
                winLine = line; // Record the losing line
                // Continue checking other axes in case of simultaneous win (if rule allows win > loss)
                // Assuming Win > Loss: check implies we prioritize 'won'. 
                // If we finish loop and won is true, we return won.
                // If won is false but lost is true, we return lost.
            }
        }

        return { won, lost: !won && lost, line: winLine };
    }
}
