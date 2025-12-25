export type PieceType = 'man' | 'king';
export type Player = 'red' | 'black';

export interface Piece {
    type: PieceType;
    owner: Player;
}

export type Board = (Piece | null)[][]; // 8x8

export interface Position {
    r: number;
    c: number;
}

export interface Move {
    from: Position;
    to: Position;
    isJump: boolean;
    jumpedPiece?: Position; // Position of the captured piece
}

export interface GameState {
    board: Board;
    turn: Player;
    winner: Player | 'draw' | null;
    history: Move[];
    mustJump: boolean; // If true, current player MUST jump
    activePiece: Position | null; // If set, only this piece can move (multi-jump in progress)
}

export const ROWS = 10;
export const COLS = 10;
