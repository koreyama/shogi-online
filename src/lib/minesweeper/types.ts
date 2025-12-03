export type GameStatus = 'initial' | 'playing' | 'won' | 'lost';

export interface Cell {
    row: number;
    col: number;
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
}

export type Board = Cell[][];

export interface Difficulty {
    name: string;
    rows: number;
    cols: number;
    mines: number;
}

export interface GameState {
    board: Board;
    status: GameStatus;
    difficulty: Difficulty;
    startTime: number | null;
    endTime: number | null;
    minesLeft: number;
}

export const DIFFICULTIES: Record<string, Difficulty> = {
    EASY: { name: '初級', rows: 9, cols: 9, mines: 10 },
    MEDIUM: { name: '中級', rows: 16, cols: 16, mines: 40 },
    HARD: { name: '上級', rows: 16, cols: 30, mines: 99 },
};
