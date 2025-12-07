export type PlayerColor = 'P1' | 'P2'; // Canvas (Cyan) vs Neon (Magenta)
export type Board = (PlayerColor | null)[][];

export interface Point {
    x: number;
    y: number;
}

export interface Piece {
    id: string;
    name: string;
    shape: number[][]; // 0 or 1 grid
    value: number; // Number of blocks
}

export interface PlacedPiece {
    pieceId: string;
    player: PlayerColor;
    position: Point; // Top-left of the shape matrix on the board
    shape: number[][]; // The specific rotation/flip used
}

export interface GameState {
    board: (PlayerColor | null)[][];
    currentPlayer: PlayerColor;
    projectedScore: { P1: number, P2: number };
    hands: {
        P1: Piece[];
        P2: Piece[];
    };
    isGameOver: boolean;
    turnCount: number;
    lastPlaced?: PlacedPiece;
    statusMessage?: string;
}

export const BOARD_SIZE = 14;
