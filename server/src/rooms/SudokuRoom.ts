import { Room, Client } from "colyseus";
import { SudokuState, SudokuPlayer } from "./schema/SudokuState";

// Difficulty settings (clue counts)
const DIFFICULTY_CLUES: Record<string, number> = {
    EASY: 38,
    MEDIUM: 32,
    HARD: 26,
    EXPERT: 22,
};

export class SudokuRoom extends Room<SudokuState> {
    maxClients = 4;

    onCreate(options: any) {
        console.log("SudokuRoom created!", options);
        this.setMetadata({
            mode: options.mode,
            roomId: this.roomId
        });

        this.setState(new SudokuState());

        if (options?.difficulty) {
            this.state.difficulty = options.difficulty;
        }

        // Message handlers
        this.onMessage("ready", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.isReady = !player.isReady;
                this.checkStartGame();
            }
        });

        this.onMessage("place", (client, message) => {
            this.handlePlace(client, message.index, message.value);
        });

        this.onMessage("forceStart", () => {
            this.startGame();
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined Sudoku!");

        // Zombie purge
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

        const player = new SudokuPlayer();
        player.id = incomingPlayerId || client.sessionId;
        player.name = options?.name || "Guest";
        player.isReady = false;
        this.state.players.set(client.sessionId, player);

        if (this.state.players.size >= 2) {
            this.lock();
        }
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.players.size < 2) {
            this.unlock();
            if (this.state.status === "playing") {
                this.state.status = "finished";
                this.broadcast("notification", { message: "相手が退出しました" });
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

        const clueCount = DIFFICULTY_CLUES[this.state.difficulty] || 38;

        // Generate a different puzzle for each player
        this.state.players.forEach(player => {
            player.status = "playing";
            player.progress = 0;
            player.finishTime = 0;
            player.puzzle.clear();
            player.solution.clear();
            player.boardValues.clear();

            const { puzzle, solution } = this.generatePuzzle(clueCount);

            for (let i = 0; i < 81; i++) {
                player.puzzle.push(puzzle[i]);
                player.solution.push(solution[i]);
                player.boardValues.push(puzzle[i]); // Start with clues
            }
        });
    }

    handlePlace(client: Client, index: number, value: number) {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.status !== "playing") return;
        if (player.status === "finished") return;
        if (index < 0 || index >= 81) return;

        // Can't modify clues
        if (player.puzzle[index] !== 0) return;

        // Place the value
        player.boardValues[index] = value;

        // Update progress
        this.updateProgress(player);

        // Check win
        this.checkWin(player);
    }

    updateProgress(player: SudokuPlayer) {
        let filled = 0;
        let correct = 0;

        for (let i = 0; i < 81; i++) {
            if (player.boardValues[i] !== 0) {
                filled++;
                if (player.boardValues[i] === player.solution[i]) {
                    correct++;
                }
            }
        }

        // Progress based on correct cells
        player.progress = Math.floor((correct / 81) * 100);
    }

    checkWin(player: SudokuPlayer) {
        // Check if all cells match solution
        for (let i = 0; i < 81; i++) {
            if (player.boardValues[i] !== player.solution[i]) {
                return;
            }
        }

        // Winner!
        player.status = "finished";
        player.finishTime = Date.now() - this.state.startTime;
        this.state.status = "finished";
        this.state.winnerId = player.id;
        this.broadcast("winner", { winnerId: player.id, winnerName: player.name });
    }

    // --- Sudoku Generation ---
    generatePuzzle(targetClues: number): { puzzle: number[]; solution: number[] } {
        const solution = this.generateSolvedGrid();
        const puzzle = [...solution];

        // Remove cells to reach target clue count
        const positions = this.shuffle([...Array(81).keys()]);
        let currentClues = 81;

        for (const pos of positions) {
            if (currentClues <= targetClues) break;

            // Check if removing would leave box empty
            const boxRow = Math.floor(Math.floor(pos / 9) / 3) * 3;
            const boxCol = Math.floor((pos % 9) / 3) * 3;
            let boxClueCount = 0;
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    if (puzzle[r * 9 + c] !== 0) boxClueCount++;
                }
            }
            if (boxClueCount <= 1) continue;

            puzzle[pos] = 0;
            currentClues--;
        }

        return { puzzle, solution };
    }

    generateSolvedGrid(): number[] {
        const grid = new Array(81).fill(0);
        this.solve(grid);
        return grid;
    }

    solve(grid: number[]): boolean {
        for (let i = 0; i < 81; i++) {
            if (grid[i] === 0) {
                const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of nums) {
                    if (this.isValid(grid, i, num)) {
                        grid[i] = num;
                        if (this.solve(grid)) return true;
                        grid[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    isValid(grid: number[], idx: number, num: number): boolean {
        const row = Math.floor(idx / 9);
        const col = idx % 9;

        // Check row
        for (let c = 0; c < 9; c++) {
            if (grid[row * 9 + c] === num) return false;
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (grid[r * 9 + col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r * 9 + c] === num) return false;
            }
        }

        return true;
    }

    shuffle<T>(array: T[]): T[] {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
