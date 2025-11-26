export type Player = 'red' | 'yellow';
export type Cell = Player | null;
export type Board = Cell[][]; // 6 rows, 7 columns

export const ROWS = 6;
export const COLS = 7;

export interface Coordinates {
    row: number;
    col: number;
}

export interface GameState {
    board: Board;
    turn: Player;
    winner: Player | 'draw' | null;
    history: number[]; // Column indices of moves
    winningLine: Coordinates[] | null;
}
