export type Hex = { q: number; r: number; s: number };
export type Player = 1 | 2; // 1: Blue (First), 2: Red (Second)
export type Turn = Player;
export type GameState = 'playing' | 'won' | 'lost';

export const HEX_SIZE = 25;
export const BOARD_RADIUS = 5;

export const DIRECTIONS = [
    { q: 1, r: 0, s: -1 }, { q: 1, r: -1, s: 0 }, { q: 0, r: -1, s: 1 },
    { q: -1, r: 0, s: 1 }, { q: -1, r: 1, s: 0 }, { q: 0, r: 1, s: -1 }
];
