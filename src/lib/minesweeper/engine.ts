import { Board, Cell, Difficulty, GameState, GameStatus } from './types';

export const createEmptyBoard = (rows: number, cols: number): Board => {
    const board: Board = [];
    for (let r = 0; r < rows; r++) {
        const row: Cell[] = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                row: r,
                col: c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
            });
        }
        board.push(row);
    }
    return board;
};

// Simple Seeded RNG (Linear Congruential Generator)
class SeededRNG {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

export const initializeBoard = (rows: number, cols: number, mines: number, firstClick?: { r: number, c: number }, seed?: number): Board => {
    const board = createEmptyBoard(rows, cols);
    let minesPlaced = 0;

    const rng = seed !== undefined ? new SeededRNG(seed) : null;
    const random = () => rng ? rng.next() : Math.random();

    // If seeded, we place mines potentially EVERYWHERE first (ignoring firstClick for now)
    // If NOT seeded (Single Player), we respect firstClick explicitly in placement loop
    const ignoreFirstClick = seed !== undefined;

    while (minesPlaced < mines) {
        const r = Math.floor(random() * rows);
        const c = Math.floor(random() * cols);

        // Avoid placing mine on first click and its neighbors (Only for Single Player Random)
        if (!ignoreFirstClick && firstClick && Math.abs(r - firstClick.r) <= 1 && Math.abs(c - firstClick.c) <= 1) continue;

        if (!board[r][c].isMine) {
            board[r][c].isMine = true;
            minesPlaced++;
        }
    }

    // For Seeded (Multiplayer): Logic to move mine if first click hits one
    // This happens OUTSIDE initializeBoard usually, or we do it here if firstClick is provided with seed.
    // However, to keep it simple, we will return the "Raw" board for seeded, and let revealCell handle the safe-move.
    // CALCULATE NEIGHBORS AFTER FINALIZATION

    if (!ignoreFirstClick) {
        calculateNeighborMines(board, rows, cols);
    }

    return board;
};

const calculateNeighborMines = (board: Board, rows: number, cols: number) => {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].isMine) {
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c].neighborMines = count;
            }
        }
    }
};

export const revealCell = (gameState: GameState, r: number, c: number, seed?: number): GameState => {
    if (gameState.status !== 'playing' && gameState.status !== 'initial') return gameState;

    let newBoard = [...gameState.board.map(row => [...row.map(cell => ({ ...cell }))])];
    let newStatus = gameState.status;
    let newStartTime = gameState.startTime;

    // First click initialization
    if (gameState.status === 'initial') {
        // If seeded, we pass the seed. firstClick arg is ignored for placement in seeded mode.
        newBoard = initializeBoard(gameState.difficulty.rows, gameState.difficulty.cols, gameState.difficulty.mines, { r, c }, seed);

        // Multiplayer (Seeded) First Click Safety: If we hit a mine, move it to the first empty spot
        if (seed !== undefined && newBoard[r][c].isMine) {
            newBoard[r][c].isMine = false;
            let moved = false;
            for (let rr = 0; rr < gameState.difficulty.rows; rr++) {
                for (let cc = 0; cc < gameState.difficulty.cols; cc++) {
                    if (!newBoard[rr][cc].isMine && (rr !== r || cc !== c)) {
                        newBoard[rr][cc].isMine = true;
                        moved = true;
                        break;
                    }
                }
                if (moved) break;
            }
        }

        // If seeded, we need to calc neighbors NOW after potential mine move
        if (seed !== undefined) {
            calculateNeighborMines(newBoard, gameState.difficulty.rows, gameState.difficulty.cols);
        }

        newStatus = 'playing';
        newStartTime = Date.now();
    }

    const cell = newBoard[r][c];

    if (cell.isRevealed || cell.isFlagged) return { ...gameState, board: newBoard, status: newStatus, startTime: newStartTime };

    if (cell.isMine) {
        // Game Over
        cell.isRevealed = true;
        // Reveal all mines
        newBoard.forEach(row => row.forEach(c => {
            if (c.isMine) c.isRevealed = true;
        }));
        return {
            ...gameState,
            board: newBoard,
            status: 'lost',
            endTime: Date.now(),
            startTime: newStartTime
        };
    }

    // Flood fill
    const stack = [{ r, c }];
    while (stack.length > 0) {
        const { r, c } = stack.pop()!;
        const current = newBoard[r][c];

        if (current.isRevealed || current.isFlagged) continue;

        current.isRevealed = true;

        if (current.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < gameState.difficulty.rows && nc >= 0 && nc < gameState.difficulty.cols) {
                        if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
                            stack.push({ r: nr, c: nc });
                        }
                    }
                }
            }
        }
    }

    // Check Win
    let unrevealedSafeCells = 0;
    newBoard.forEach(row => row.forEach(c => {
        if (!c.isMine && !c.isRevealed) unrevealedSafeCells++;
    }));

    if (unrevealedSafeCells === 0) {
        return {
            ...gameState,
            board: newBoard,
            status: 'won',
            endTime: Date.now(),
            startTime: newStartTime,
            minesLeft: 0
        };
    }

    return {
        ...gameState,
        board: newBoard,
        status: newStatus,
        startTime: newStartTime
    };
};

export const toggleFlag = (gameState: GameState, r: number, c: number): GameState => {
    if (gameState.status !== 'playing' && gameState.status !== 'initial') return gameState;

    const newBoard = [...gameState.board.map(row => [...row.map(cell => ({ ...cell }))])];
    const cell = newBoard[r][c];

    if (cell.isRevealed) return gameState;

    cell.isFlagged = !cell.isFlagged;

    let minesLeft = gameState.minesLeft;
    if (cell.isFlagged) minesLeft--;
    else minesLeft++;

    return {
        ...gameState,
        board: newBoard,
        minesLeft
    };
};
