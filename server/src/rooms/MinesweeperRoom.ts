import { Room, Client } from "colyseus";
import { MinesweeperState, MinesweeperPlayer } from "./schema/MinesweeperState";

export class MinesweeperRoom extends Room<MinesweeperState> {
    maxClients = 4;

    onCreate(options: any) {
        console.log("MinesweeperRoom created!", options);
        this.setMetadata({
            mode: options.mode,
            roomId: this.roomId
        });

        this.setState(new MinesweeperState());

        // Handle options
        if (options && options.difficulty) {
            // Check formatted string OR direct name (Japanese)
            if (options.difficulty === 'MEDIUM' || options.difficulty === '中級') {
                this.state.width = 16;
                this.state.height = 16;
                this.state.mineCount = 40;
            } else if (options.difficulty === 'HARD' || options.difficulty === '上級') {
                // HARD: 30x16
                this.state.width = 30; // Note: In types.ts it says cols=30, here width=30. Matches.
                this.state.height = 16;
                this.state.mineCount = 99;
            } else {
                // EASY / 初級
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

        this.onMessage("ready", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.isReady = !player.isReady;
                // If all ready, start
                this.checkStartGame();
            }
        });

        // Debug start
        this.onMessage("forceStart", (client) => {
            this.startGame();
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined Minesweeper!");

        // --- ZOMBIE PURGE ---
        const incomingPlayerId = options.playerId;
        if (incomingPlayerId) {
            let sameUserSessionId: string | null = null;
            this.state.players.forEach((p, sessionId) => {
                if (p.id === incomingPlayerId) sameUserSessionId = sessionId;
            });

            if (sameUserSessionId) {
                this.state.players.delete(sameUserSessionId);
                const duplicateClient = this.clients.find(c => c.sessionId === sameUserSessionId);
                if (duplicateClient) duplicateClient.leave();
            }
        }
        // --------------------

        const player = new MinesweeperPlayer();
        player.id = incomingPlayerId || client.sessionId;
        player.name = (options && options.name) ? options.name : "Guest";
        player.isReady = false;
        this.state.players.set(client.sessionId, player);

        if (this.state.players.size >= 2) {
            this.lock();
            // Do NOT auto start. Wait for Ready.
        }
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.players.size < 2) {
            this.unlock();
            // Reset game state if someone leaves mid-game?
            if (this.state.status === "playing") {
                this.state.status = "finished"; // or waiting?
                this.broadcast("notification", { message: "Opponent left." });
            }
        }
    }

    checkStartGame() {
        if (this.state.players.size < 2) return;

        let allReady = true;
        this.state.players.forEach(p => {
            if (!p.isReady) allReady = false;
        });

        if (allReady) {
            this.startGame();
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
            player.mines.clear(); // Clear mines, generate on first click

            // Init Cell States (0: Hidden)
            for (let i = 0; i < this.state.width * this.state.height; i++) {
                player.cellStates.push(0);
            }
        });
    }

    generateBoard(player: MinesweeperPlayer, safeIndex: number) {
        const size = this.state.width * this.state.height;
        const w = this.state.width;

        player.mines.clear();
        for (let i = 0; i < size; i++) player.mines.push(0);

        // Determine safe zone (clicked cell + neighbors)
        const safeZone = new Set<number>();
        safeZone.add(safeIndex);

        const sy = Math.floor(safeIndex / w);
        const sx = safeIndex % w;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = sx + dx;
                const ny = sy + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < this.state.height) {
                    safeZone.add(ny * w + nx);
                }
            }
        }

        let placed = 0;
        while (placed < this.state.mineCount) {
            const idx = Math.floor(Math.random() * size);
            // Must not be in safe zone and not already a mine
            if (!safeZone.has(idx) && player.mines[idx] === 0) {
                player.mines[idx] = 1;
                placed++;
            }
        }
        console.log(`Generated board for ${player.name} with safe index ${safeIndex}`);
    }

    handleReveal(client: Client, index: number) {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.status !== "playing") return;
        if (player.status === "frozen" || player.status === "finished") return;

        // --- LAZY GENERATION (Safe Start) ---
        if (player.mines.length === 0) {
            this.generateBoard(player, index);
        }
        // ------------------------------------

        if (index < 0 || index >= this.state.width * this.state.height) return; // FIX: use calculated size
        if (player.cellStates[index] !== 0) return; // 0 is Hidden

        // Check Mine
        if (player.mines[index] === 1) {
            // BOOM
            player.status = "frozen";
            player.cellStates[index] = 1; // Reveal

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
