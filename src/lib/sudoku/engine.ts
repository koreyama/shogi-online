// Sudoku Engine - Puzzle Generation, Validation, and Solving

import { Board, Cell, Difficulty, GameState } from './types';

// Create an empty 9x9 board
export function createEmptyBoard(): Board {
    return Array(9).fill(null).map(() =>
        Array(9).fill(null).map(() => ({
            value: 0,
            isFixed: false,
            isError: false,
            notes: new Set<number>(),
        }))
    );
}

// Check if placing `num` at (row, col) is valid
export function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
        if (grid[r][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (grid[r][c] === num) return false;
        }
    }

    return true;
}

// Solve the puzzle using backtracking
function solve(grid: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                // Try numbers 1-9 in random order for variety
                const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of nums) {
                    if (isValidPlacement(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (solve(grid)) {
                            return true;
                        }
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Generate a complete solved Sudoku grid
function generateSolvedGrid(): number[][] {
    const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
    solve(grid);
    return grid;
}

// Count solutions (for uniqueness check) - returns early if > 1
function countSolutions(grid: number[][], count = { value: 0 }): number {
    if (count.value > 1) return count.value;

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValidPlacement(grid, row, col, num)) {
                        grid[row][col] = num;
                        countSolutions(grid, count);
                        grid[row][col] = 0;
                        if (count.value > 1) return count.value;
                    }
                }
                return count.value;
            }
        }
    }
    count.value++;
    return count.value;
}

// Generate a puzzle with a unique solution
export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: number[][] } {
    const solution = generateSolvedGrid();

    // Create a copy to remove cells from
    const puzzleGrid: number[][] = solution.map(row => [...row]);

    // Get all cell positions and shuffle
    const positions: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            positions.push([r, c]);
        }
    }
    const shuffledPositions = shuffle(positions);

    // Remove cells until we reach the target clue count
    let currentClues = 81;
    const targetClues = difficulty.clues;

    for (const [row, col] of shuffledPositions) {
        if (currentClues <= targetClues) break;

        // Check if removing this cell would leave the 3x3 box empty
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        let boxClueCount = 0;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (puzzleGrid[r][c] !== 0) boxClueCount++;
            }
        }
        // Don't remove if it would leave the box with 0 clues
        if (boxClueCount <= 1) continue;

        const backup = puzzleGrid[row][col];
        puzzleGrid[row][col] = 0;

        // Check if still has unique solution
        const testGrid = puzzleGrid.map(r => [...r]);
        const solutions = countSolutions(testGrid);

        if (solutions !== 1) {
            // Restore if not unique
            puzzleGrid[row][col] = backup;
        } else {
            currentClues--;
        }
    }

    // Convert to Board format
    const puzzle: Board = puzzleGrid.map((row, r) =>
        row.map((value, c) => ({
            value,
            isFixed: value !== 0,
            isError: false,
            notes: new Set<number>(),
        }))
    );

    return { puzzle, solution };
}

// Check if the board is completely and correctly filled
export function checkWin(board: Board, solution: number[][]): boolean {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c].value !== solution[r][c]) {
                return false;
            }
        }
    }
    return true;
}

// Place a number and check for conflicts
export function placeNumber(state: GameState, row: number, col: number, num: number): GameState {
    const { board, solution } = state;

    // Can't modify fixed cells
    if (board[row][col].isFixed) return state;

    const newBoard = board.map(r => r.map(cell => ({ ...cell, notes: new Set(cell.notes) })));
    newBoard[row][col].value = num;

    // Clear notes when placing a number
    if (num !== 0) {
        newBoard[row][col].notes.clear();
    }

    // Update conflict-based error states for all cells
    updateConflicts(newBoard);

    const won = checkWin(newBoard, solution);

    return {
        ...state,
        board: newBoard,
        status: won ? 'won' : 'playing',
    };
}

// Find all cells with conflicts (same number in row/col/box)
function updateConflicts(board: Board): void {
    // Reset all errors first
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            board[r][c].isError = false;
        }
    }

    // Check each cell for conflicts
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = board[r][c].value;
            if (val === 0) continue;

            // Check row for duplicate
            for (let c2 = 0; c2 < 9; c2++) {
                if (c2 !== c && board[r][c2].value === val) {
                    board[r][c].isError = true;
                    board[r][c2].isError = true;
                }
            }

            // Check column for duplicate
            for (let r2 = 0; r2 < 9; r2++) {
                if (r2 !== r && board[r2][c].value === val) {
                    board[r][c].isError = true;
                    board[r2][c].isError = true;
                }
            }

            // Check 3x3 box for duplicate
            const boxRow = Math.floor(r / 3) * 3;
            const boxCol = Math.floor(c / 3) * 3;
            for (let r2 = boxRow; r2 < boxRow + 3; r2++) {
                for (let c2 = boxCol; c2 < boxCol + 3; c2++) {
                    if ((r2 !== r || c2 !== c) && board[r2][c2].value === val) {
                        board[r][c].isError = true;
                        board[r2][c2].isError = true;
                    }
                }
            }
        }
    }
}

// Toggle a note (pencil mark)
export function toggleNote(state: GameState, row: number, col: number, num: number): GameState {
    const { board } = state;

    // Can't add notes to fixed or filled cells
    if (board[row][col].isFixed || board[row][col].value !== 0) return state;

    const newBoard = board.map(r => r.map(cell => ({ ...cell, notes: new Set(cell.notes) })));

    if (newBoard[row][col].notes.has(num)) {
        newBoard[row][col].notes.delete(num);
    } else {
        newBoard[row][col].notes.add(num);
    }

    return {
        ...state,
        board: newBoard,
    };
}

// Create initial game state
export function createGameState(difficulty: Difficulty): GameState {
    const { puzzle, solution } = generatePuzzle(difficulty);
    return {
        board: puzzle,
        solution,
        status: 'playing',
        difficulty,
        startTime: Date.now(),
        selectedCell: null,
    };
}
