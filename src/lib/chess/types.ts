export type Player = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Piece {
    type: PieceType;
    player: Player;
    hasMoved?: boolean;
}

export type BoardState = (Piece | null)[][];

export interface Coordinates {
    x: number;
    y: number;
}

export interface Move {
    from: Coordinates;
    to: Coordinates;
    promotion?: PieceType;
}

export interface GameState {
    board: BoardState;
    turn: Player;
    winner: Player | 'draw' | null;
    isGameOver: boolean;
    history: Move[];
    inCheck: boolean;
}

export const BOARD_SIZE = 8;
