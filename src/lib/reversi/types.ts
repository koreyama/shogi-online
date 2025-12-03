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
    flipped: Coordinates[]; // 裏返った石の座標
}

export interface GameState {
    board: BoardState;
    turn: Player;
    winner: Player | 'draw' | null;
    history: Move[];
    blackCount: number;
    whiteCount: number;
    canMove: boolean; // 現在のプレイヤーが置ける場所があるか
}
