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

export const initializeBoard = (rows: number, cols: number, mines: number, firstClick: { r: number, c: number }): Board => {
    const board = createEmptyBoard(rows, cols);
    let minesPlaced = 0;

    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        // Avoid placing mine on first click and its neighbors
        if (Math.abs(r - firstClick.r) <= 1 && Math.abs(c - firstClick.c) <= 1) continue;

        if (!board[r][c].isMine) {
            board[r][c].isMine = true;
            minesPlaced++;
        }
    }

    // Calculate neighbor mines
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

    return board;
};

export const revealCell = (gameState: GameState, r: number, c: number): GameState => {
    if (gameState.status !== 'playing' && gameState.status !== 'initial') return gameState;

    let newBoard = [...gameState.board.map(row => [...row.map(cell => ({ ...cell }))])];
    let newStatus = gameState.status;
    let newStartTime = gameState.startTime;

    // First click initialization
    if (gameState.status === 'initial') {
        newBoard = initializeBoard(gameState.difficulty.rows, gameState.difficulty.cols, gameState.difficulty.mines, { r, c });
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
