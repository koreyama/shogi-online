import { BoardState, Coordinates, Player } from './types';
import { getValidMoves, executeMove } from './engine';

// Positional weights
// Corners are high value. Standard Reversi strategy.
const WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100],
];

export const evaluateBoard = (board: BoardState, player: Player): number => {
    let score = 0;
    const opponent = player === 'black' ? 'white' : 'black';

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const cell = board[y][x];
            if (cell === player) {
                score += WEIGHTS[y][x];
            } else if (cell === opponent) {
                score -= WEIGHTS[y][x];
            }
        }
    }
    return score;
};

export const getBestMove = (board: BoardState, player: Player): Coordinates | null => {
    const validMoves = getValidMoves(board, player);
    if (validMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove: Coordinates | null = null;

    // Simple 1-ply search (Greedy based on positional weights)
    // Could interfere with corners if we look only 1 step ahead (e.g. giving corner in next turn)
    // But for "Level 1" upgrade from Random, this is huge.

    // Let's do a tiny bit better: Randomize equal scores to avoid repetitive play

    const candidates: { move: Coordinates, score: number }[] = [];

    for (const move of validMoves) {
        // Simulate move
        // Note: We need a way to simulate without full state if possible, or we mock state
        // engine.ts executeMove takes GameState. Let's make a lightweight helper or mock it.
        // Actually, we can just manually update the board for evaluation since evaluateBoard only cares about placement.
        // BUT executeMove does flips! We MUST know what flips.

        // Let's reconstruct a temp state to use executeMove
        const tempState = {
            board: JSON.parse(JSON.stringify(board)), // Deep copy
            turn: player,
            winner: null,
            history: [],
            blackCount: 0,
            whiteCount: 0,
            canMove: true
        };

        const nextState = executeMove(tempState, move.x, move.y);
        const score = evaluateBoard(nextState.board, player);

        candidates.push({ move, score });

        if (score > bestScore) {
            bestScore = score;
        }
    }

    const bestCandidates = candidates.filter(c => c.score === bestScore);
    return bestCandidates[Math.floor(Math.random() * bestCandidates.length)].move;
};
