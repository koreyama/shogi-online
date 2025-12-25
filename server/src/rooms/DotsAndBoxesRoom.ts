import { Room, Client } from "colyseus";
import { DotsAndBoxesState, Player } from "./schema/DotsAndBoxesState";

export class DotsAndBoxesRoom extends Room<DotsAndBoxesState> {
    maxClients = 4;

    onCreate(options: any) {
        console.log("DotsAndBoxesRoom created!", options);
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setState(new DotsAndBoxesState());

        this.onMessage("placeLine", (client, message) => {
            this.handlePlaceLine(client, message);
        });

        this.onMessage("restart", (client, message) => {
            // Only allow restart if game is finished
            if (this.state.winner !== 0) {
                // Determine new starting player (swap)
                const newStartingPlayer = this.state.currentPlayer === 1 ? 2 : 1;
                // Preserve players, reset board
                const p1 = this.state.players.get(this.clients[0].sessionId);
                const p2 = this.state.players.get(this.clients[1].sessionId);

                // Reset State
                const rows = this.state.rows;
                const cols = this.state.cols;

                // Manually reset arrays is safer to keep schema refs, but creating new State is easier
                // However, creating new State might break client refs if not careful? 
                // Colyseus handles it, but let's reset values.

                // Clear lines
                for (let i = 0; i < this.state.hLines.length; i++) this.state.hLines[i] = 0;
                for (let i = 0; i < this.state.vLines.length; i++) this.state.vLines[i] = 0;

                // Clear boxes
                for (let i = 0; i < this.state.boxes.length; i++) this.state.boxes[i] = 0;

                // Reset scores
                this.state.players.forEach(p => p.score = 0);

                this.state.winner = 0;
                this.state.currentPlayer = newStartingPlayer; // Winner or loser starts? Or swap? Let's swap.

                // Broadcast restart
                this.broadcast("gameRestarted");
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`[DotsAndBoxesRoom] ${client.sessionId} joining...`, options);

        // 1. Zombie Purge & Duplicate Purge (by persistent playerId)
        const activeSessionIds = new Set(this.clients.map(c => c.sessionId));
        const incomingPlayerId = options.playerId;

        const toRemove: string[] = [];
        this.state.players.forEach((p, key) => {
            // Remove if session is dead OR if it's the same user (playerId)
            if (!activeSessionIds.has(key) || (incomingPlayerId && p.playerId === incomingPlayerId)) {
                console.log(`[DotsAndBoxesRoom] Purging session ${key} (PlayerId: ${p.playerId})`);
                toRemove.push(key);
            }
        });
        toRemove.forEach(key => this.state.players.delete(key));

        const player = new Player();
        player.id = client.sessionId;
        player.playerId = incomingPlayerId || "";
        player.name = options.name || `Player ${this.state.players.size + 1}`;

        // Explicit role assignment
        if (this.state.players.size === 0) {
            player.role = "P1";
        } else if (this.state.players.size === 1) {
            player.role = "P2";
        } else {
            player.role = "spectator";
        }

        this.state.players.set(client.sessionId, player);

        if (this.state.players.size === 2) {
            this.state.gameStarted = true;
            this.lock(); // Lock room when full (now that we have headcount)
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`[DotsAndBoxesRoom] ${client.sessionId} left.`);

        const player = this.state.players.get(client.sessionId);
        const isParticipant = player && (player.role === 'P1' || player.role === 'P2');

        if (player) {
            this.broadcast("chat", {
                id: `system-${Date.now()}`,
                sender: "System",
                text: `${player.name}さんが退出しました。`,
                timestamp: Date.now()
            });
        }

        this.state.players.delete(client.sessionId);

        if (isParticipant) {
            this.state.gameStarted = false;
            this.broadcast("roomDissolved", { reason: "Opponent left the game." });
            this.unlock();

            // Give remaining clients a moment to see the message before closing the room
            this.clock.setTimeout(() => {
                this.clients.forEach(c => {
                    if (c.sessionId !== client.sessionId) {
                        c.leave();
                    }
                });
            }, 1000);
        }
    }

    onDispose() {
        console.log("room disposed");
    }

    handlePlaceLine(client: Client, message: { type: 'h' | 'v', r: number, c: number }) {
        if (!this.state.gameStarted || this.state.winner !== 0) return;

        // Verify it is this client's turn
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        const myPlayerNum = player.role === "P1" ? 1 : 2;
        if (this.state.currentPlayer !== myPlayerNum) return;

        const { type, r, c } = message;

        let lineValid = false;
        let boxCompleted = false;

        // Check validity and update line
        if (type === 'h') {
            // Horizontal line
            const index = r * (this.state.cols - 1) + c;
            if (index >= 0 && index < this.state.hLines.length && this.state.hLines[index] === 0) {
                this.state.hLines[index] = myPlayerNum;
                lineValid = true;
            }
        } else if (type === 'v') {
            // Vertical line
            const index = r * (this.state.cols) + c;
            if (index >= 0 && index < this.state.vLines.length && this.state.vLines[index] === 0) {
                this.state.vLines[index] = myPlayerNum;
                lineValid = true;
            }
        }

        if (lineValid) {
            // Check for completed boxes
            const completedBoxes = this.checkCompletedBoxes();
            if (completedBoxes > 0) {
                // Player gets points and keeps turn
                const player = this.state.players.get(client.sessionId);
                if (player) {
                    player.score += completedBoxes;
                }
                boxCompleted = true;

                // Check Win Condition
                const totalBoxes = (this.state.rows - 1) * (this.state.cols - 1);
                let filledBoxes = 0;
                this.state.players.forEach(p => filledBoxes += p.score);

                if (filledBoxes >= totalBoxes) {
                    // Game Over
                    const p1 = this.state.players.get(this.clients[0].sessionId);
                    const p2 = this.state.players.get(this.clients[1].sessionId);
                    if (p1 && p2) {
                        if (p1.score > p2.score) this.state.winner = 1;
                        else if (p2.score > p1.score) this.state.winner = 2;
                        else this.state.winner = 3; // Draw
                    }
                }

            } else {
                // Switch turn
                this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
            }
        }
    }

    checkCompletedBoxes(): number {
        let completedCount = 0;
        const rows = this.state.rows;
        const cols = this.state.cols;

        // Iterate all boxes
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const boxIndex = r * (cols - 1) + c;

                // If box is already owned, skip
                if (this.state.boxes[boxIndex] !== 0) continue;

                // Check 4 sides
                // Top: hLine at (r, c)
                const top = this.state.hLines[r * (cols - 1) + c];
                // Bottom: hLine at (r+1, c)
                const bottom = this.state.hLines[(r + 1) * (cols - 1) + c];
                // Left: vLine at (r, c)
                const left = this.state.vLines[r * cols + c];
                // Right: vLine at (r, c+1)
                const right = this.state.vLines[r * cols + (c + 1)];

                if (top && bottom && left && right) {
                    this.state.boxes[boxIndex] = this.state.currentPlayer;
                    completedCount++;
                }
            }
        }
        return completedCount;
    }
}
