// Sudoku Types

export interface Cell {
    value: number; // 0 = empty, 1-9 = value
    isFixed: boolean; // True if this is a clue (non-editable)
    isError: boolean; // True if current value conflicts
    notes: Set<number>; // Candidate numbers
}

export type Board = Cell[][];

export interface Difficulty {
    name: string;
    clues: number; // Number of cells pre-filled
}

export const DIFFICULTIES: Record<string, Difficulty> = {
    EASY: { name: 'かんたん', clues: 38 },
    MEDIUM: { name: 'ふつう', clues: 32 },
    HARD: { name: 'むずかしい', clues: 26 },
    EXPERT: { name: 'エキスパート', clues: 22 },
};

export interface GameState {
    board: Board;
    solution: number[][]; // Full solved board for validation
    status: 'playing' | 'won';
    difficulty: Difficulty;
    mistakes: number;
    startTime: number | null;
    selectedCell: { row: number; col: number } | null;
}
