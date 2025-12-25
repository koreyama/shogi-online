import { Room, Client } from "colyseus";
import { DotsAndBoxesState, Player } from "./schema/DotsAndBoxesState";

export class DotsAndBoxesRoom extends Room<DotsAndBoxesState> {
    maxClients = 2;

    onCreate(options: any) {
        console.log("DotsAndBoxesRoom created!", options);
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
                for (let i = 0; i < this.state.hLines.length; i++) this.state.hLines[i] = false;
                for (let i = 0; i < this.state.vLines.length; i++) this.state.vLines[i] = false;

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
        console.log(client.sessionId, "joined!");

        const player = new Player();
        player.id = client.sessionId;
        player.name = options.name || `Player ${this.clients.length}`;

        this.state.players.set(client.sessionId, player);

        if (this.clients.length === 2) {
            this.state.gameStarted = true;
            this.lock(); // Lock room when full
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
        this.state.gameStarted = false;
        // Optional: Declare winner by forfeit?
    }

    onDispose() {
        console.log("room disposed");
    }

    handlePlaceLine(client: Client, message: { type: 'h' | 'v', r: number, c: number }) {
        if (!this.state.gameStarted || this.state.winner !== 0) return;

        // Verify it is this client's turn
        const playerIndex = this.clients.findIndex(c => c.sessionId === client.sessionId) + 1; // 1 or 2
        if (this.state.currentPlayer !== playerIndex) return;

        const { type, r, c } = message;

        let lineValid = false;
        let boxCompleted = false;

        // Check validity and update line
        if (type === 'h') {
            // Horizontal line
            const index = r * (this.state.cols - 1) + c;
            if (index >= 0 && index < this.state.hLines.length && !this.state.hLines[index]) {
                this.state.hLines[index] = true;
                lineValid = true;
            }
        } else if (type === 'v') {
            // Vertical line
            const index = r * (this.state.cols) + c;
            if (index >= 0 && index < this.state.vLines.length && !this.state.vLines[index]) {
                this.state.vLines[index] = true;
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
