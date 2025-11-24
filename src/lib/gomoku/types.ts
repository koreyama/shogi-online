export type Player = 'black' | 'white';
export type CellState = Player | null;
export type BoardState = CellState[][];

export interface Coordinates {
    x: number;
    y: number;
}

export interface Move {
    x: number;
    y: number;
    player: Player;
}

export interface GameState {
    board: BoardState;
    turn: Player;
    winner: Player | 'draw' | null;
    history: Move[];
    isGameOver: boolean;
}

export const BOARD_SIZE = 15;
