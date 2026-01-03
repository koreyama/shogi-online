export type PieceType =
    | 'king'    // Demon Lord (was Lion)
    | 'rook'    // Warrior (was Giraffe)
    | 'bishop'  // Mage (was Elephant)
    | 'pawn'    // Slime (was Chick)
    | 'gold';   // Hero (Promoted Slime)

export type Player = 'sente' | 'gote';

export interface Piece {
    type: PieceType;
    owner: Player;
}

export type Board = (Piece | null)[][]; // 4 rows, 3 columns

export type Hand = {
    [key in PieceType]?: number;
};

export interface GameState {
    board: Board;
    hands: {
        sente: Hand;
        gote: Hand;
    };
    turn: Player;
    winner: Player | null;
    history: any[];
}

export const ROWS = 4;
export const COLS = 3;
