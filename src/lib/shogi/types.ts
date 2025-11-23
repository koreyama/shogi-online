export type Player = 'sente' | 'gote';

export type PieceType =
  | 'pawn'   // Fu
  | 'lance'  // Kyou
  | 'knight' // Kei
  | 'silver' // Gin
  | 'gold'   // Kin
  | 'bishop' // Kaku
  | 'rook'   // Hisha
  | 'king';  // Ou/Gyoku

export type Piece = {
  type: PieceType;
  owner: Player;
  isPromoted: boolean;
  id: string; // Unique ID for React keys
};

export type Position = {
  x: number; // 1-9 (Right to Left in Shogi notation, but we might use 0-8 internally)
  y: number; // 1-9 (Top to Bottom)
};

// 0-8 index based coordinates
// x: 0 is rightmost (9 in shogi), 8 is leftmost (1 in shogi)
// y: 0 is top (1 in shogi), 8 is bottom (9 in shogi)
export type Coordinates = {
  x: number;
  y: number;
};

export type Cell = Piece | null;

export type BoardState = Cell[][]; // 9x9 grid

export type Move = {
  from: Coordinates | 'hand';
  to: Coordinates;
  piece: Piece;
  isPromotion?: boolean;
  capturedPiece?: Piece;
};

export type GameState = {
  board: BoardState;
  turn: Player;
  hands: {
    sente: Piece[];
    gote: Piece[];
  };
  selectedPosition: Coordinates | null;
  history: Move[];
  winner: Player | null;
  isCheck: boolean;
};
