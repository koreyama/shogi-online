import { Room, Client } from "colyseus";
import { MinesweeperState, MinesweeperPlayer } from "./schema/MinesweeperState";

export class MinesweeperRoom extends Room<MinesweeperState> {
    // Strictly limit to 2.
    // However, to handle the "Swap" (Zombie purge), if we are at 2, the 3rd connection is rejected before onJoin.
    // So we effectively become full if a ghost is there.
    // But since Strict Mode connects virtually simultaneously, usually the first one connects, then second.
    // Ideally we'd set maxClients higher (e.g. 4) and manually lock, so the 2nd connection can enter 'onJoin' and kill the first.
    // If we set maxClients=2, the 2nd connection might be rejected immediately if the 1st is still active.
    // BUT, the User said "Limit to 2".
    // I will set 2. If strict mode is fast enough, the first one might disconnect before 2nd joins? No, usually overlap.
    // Let's stick to the "Soft Limit" pattern: maxClients=4, manual lock at 2.
    // This allows the "cleanup" connection to get in, clean up, and stabilise the count at 1.
    maxClients = 4;

    onCreate(options: any) {
        console.log("MinesweeperRoom created!", options);
        this.setMetadata({
            mode: options.mode,
            roomId: this.roomId // Explicitly expose
        });

        this.setState(new MinesweeperState());

        // Handle options
        if (options && options.difficulty) {
            if (options.difficulty === 'MEDIUM') {
                this.state.width = 16;
                this.state.height = 16;
                this.state.mineCount = 40;
            } else if (options.difficulty === 'HARD') {
                this.state.width = 30;
                this.state.height = 16;
                this.state.mineCount = 99;
            } else {
                // EASY
                this.state.width = 9;
                this.state.height = 9;
                this.state.mineCount = 10;
            }
        }

        this.onMessage("reveal", (client, message) => {
            this.handleReveal(client, message.index);
        });

        this.onMessage("flag", (client, message) => {
            this.handleFlag(client, message.index);
        });

        this.onMessage("startGame", (client) => {
            if (this.state.players.size >= 2) {
                this.startGame();
            }
        });

        this.onMessage("restart", (client) => {
            this.startGame();
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined Minesweeper!");

        // --- ZOMBIE PURGE / DUPLICATE CHECK ---
        const incomingPlayerId = options.playerId;
        if (incomingPlayerId) {
            // Find existing player with same ID
            let sameUserSessionId: string | null = null;
            this.state.players.forEach((p, sessionId) => {
                if (p.id === incomingPlayerId) sameUserSessionId = sessionId;
            });

            if (sameUserSessionId) {
                console.log(`Duplicate player detected (${incomingPlayerId}). Removing old session ${sameUserSessionId}.`);
                // Remove from state immediately
                this.state.players.delete(sameUserSessionId);
                // Force disconnect duplicate client
                const duplicateClient = this.clients.find(c => c.sessionId === sameUserSessionId);
                if (duplicateClient) {
                    duplicateClient.leave();
                }
            }
        }
        // ---------------------------------------

        const player = new MinesweeperPlayer();
        player.id = incomingPlayerId || client.sessionId;
        player.name = (options && options.name) ? options.name : "Guest";
        this.state.players.set(client.sessionId, player);

        // Check Logic: IF we now have > 2 players (e.g. spectators?), kick logic?
        // User asked "Limit to 2".
        // With maxClients=4, we might get 3 people.
        // We should kick the 3rd one if they are not "replacing" someone.
        // But for now, let's just Rely on Lock.

        if (this.state.players.size >= 2) {
            this.lock();
            this.startGame();
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);

        if (this.state.players.size < 2) {
            this.unlock();
        }
    }

    startGame() {
        this.state.status = "playing";
        this.state.startTime = Date.now();

        this.state.players.forEach(player => {
            player.status = "playing";
            player.progress = 0;
            player.finishTime = 0;
            player.cellStates.clear();

            // 1. Generate Independent Board
            this.generateBoard(player);

            // 2. Init Cell States (0: Hidden)
            for (let i = 0; i < this.state.width * this.state.height; i++) {
                player.cellStates.push(0);
            }
        });
    }

    generateBoard(player: MinesweeperPlayer) {
        const size = this.state.width * this.state.height;
        player.mines.clear();
        for (let i = 0; i < size; i++) player.mines.push(0);

        let placed = 0;
        while (placed < this.state.mineCount) {
            const idx = Math.floor(Math.random() * size);
            if (player.mines[idx] === 0) {
                player.mines[idx] = 1;
                placed++;
            }
        }
    }

    handleReveal(client: Client, index: number) {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.status !== "playing") return;
        if (player.status === "frozen" || player.status === "finished") return;

        if (index < 0 || index >= player.mines.length) return;

        if (player.cellStates[index] !== 0) return;

        if (player.mines[index] === 1) {
            // BOOM
            player.status = "frozen";
            player.cellStates[index] = 1;

            this.clock.setTimeout(() => {
                if (player && player.status === "frozen") {
                    player.status = "playing";
                }
            }, 5000);

            return;
        }

        // Safe
        this.floodFill(player, index);
        this.checkWin(player);
        this.updateProgress(player);
    }

    handleFlag(client: Client, index: number) {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.status !== "playing" || player.status === "frozen") return;

        const current = player.cellStates[index];
        if (current === 0) {
            player.cellStates[index] = 2;
        } else if (current === 2) {
            player.cellStates[index] = 0;
        }
    }

    floodFill(player: MinesweeperPlayer, index: number) {
        const w = this.state.width;
        const h = this.state.height;
        const stack = [index];

        while (stack.length > 0) {
            const idx = stack.pop()!;
            if (player.cellStates[idx] === 1) continue;

            player.cellStates[idx] = 1;

            const x = idx % w;
            const y = Math.floor(idx / w);
            const mines = this.countNeighborMines(player, x, y);

            if (mines === 0) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const nIdx = ny * w + nx;
                            if (player.cellStates[nIdx] === 0) {
                                stack.push(nIdx);
                            }
                        }
                    }
                }
            }
        }
    }

    countNeighborMines(player: MinesweeperPlayer, x: number, y: number): number {
        let count = 0;
        const w = this.state.width;
        const h = this.state.height;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const idx = ny * w + nx;
                    if (player.mines[idx] === 1) count++;
                }
            }
        }
        return count;
    }

    updateProgress(player: MinesweeperPlayer) {
        const totalSafe = (this.state.width * this.state.height) - this.state.mineCount;
        let revealedSafe = 0;

        for (let i = 0; i < player.cellStates.length; i++) {
            if (player.cellStates[i] === 1 && player.mines[i] === 0) {
                revealedSafe++;
            }
        }
        player.progress = Math.floor((revealedSafe / totalSafe) * 100);
    }

    checkWin(player: MinesweeperPlayer) {
        const totalSafe = (this.state.width * this.state.height) - this.state.mineCount;
        let revealedSafe = 0;
        for (let i = 0; i < player.cellStates.length; i++) {
            if (player.cellStates[i] === 1 && player.mines[i] === 0) {
                revealedSafe++;
            }
        }

        if (revealedSafe === totalSafe) {
            player.status = "finished";
            player.finishTime = Date.now() - this.state.startTime;
            this.state.status = "finished";
            this.broadcast("winner", { winnerId: player.id });
        }
    }
}
