export type Player = 'first' | 'second'; // first: 下側(0-5), second: 上側(7-12)
export type BoardState = number[];
// 0-5: First Player's Pits
// 6: First Player's Store
// 7-12: Second Player's Pits
// 13: Second Player's Store

export interface GameState {
    board: BoardState;
    turn: Player;
    winner: Player | 'draw' | null;
    isGameOver: boolean;
    lastMove?: { index: number, player: Player };
}

export const PITS_PER_PLAYER = 6;
export const INITIAL_SEEDS = 4;
export const TOTAL_PITS = 14;
export const FIRST_STORE = 6;
export const SECOND_STORE = 13;
