import { GameState } from './engine';

const BOARD_SIZE = 15;
const EMPTY = 0;

// Patterns scores
const SCORES = {
    WIN: 1000000,
    OPEN_4: 100000,  // Guaranteed win next turn
    CLOSED_4: 10000, // Threat to win
    OPEN_3: 10000,   // Can become OPEN_4
    CLOSED_3: 1000,
    OPEN_2: 1000,
    CLOSED_2: 100,
    OPEN_1: 10,
    CLOSED_1: 1
};

export function getBestMove(state: GameState, aiColor: 'black' | 'white'): { x: number, y: number } | null {
    const board = state.board;
    const myColorCode = aiColor === 'black' ? 1 : 2;
    const oppColorCode = aiColor === 'black' ? 2 : 1;

    // 1. Gather Candidate Moves (Empty cells within distance 2 of existing stones)
    let candidates: { x: number, y: number }[] = [];
    let hasStones = false;

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y * BOARD_SIZE + x] !== EMPTY) {
                hasStones = true;
            } else if (isNearStone(board, x, y, 2)) {
                candidates.push({ x, y });
            }
        }
    }

    // First move policy: Center
    if (!hasStones) return { x: 7, y: 7 };
    if (candidates.length === 0) { // Should be rare if board not empty
        // Fallback to all empty
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] === EMPTY) candidates.push({ x, y });
            }
        }
    }

    let bestScore = -1;
    let bestMoves: { x: number, y: number }[] = [];

    // 2. Evaluate each candidate
    for (const move of candidates) {
        // Attack Score (My potnetial)
        const attackScore = evaluatePoint(board, move.x, move.y, myColorCode);

        // Defense Score (Opponent's potential if I don't block)
        const defenseScore = evaluatePoint(board, move.x, move.y, oppColorCode);

        // Weighted Sum (Attack is slightly preferred to break ties, but defense is critical)
        // If I have a win, take it. If opponent has a win, block it. 
        // Logic: specific critical values override sum.

        let score = 0;

        // Critical forcing moves logic
        if (attackScore >= SCORES.WIN) score = 2000000; // Win immediately
        else if (defenseScore >= SCORES.WIN) score = 1000000; // Block immediate win (unless I can win myself)
        else if (attackScore >= SCORES.OPEN_4) score = 500000; // Guaranteed win
        else if (defenseScore >= SCORES.OPEN_4) score = 400000; // Block guaranteed win
        else {
            score = attackScore + defenseScore;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }

    if (bestMoves.length === 0) return null;
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function isNearStone(board: number[], x: number, y: number, dist: number): boolean {
    const minX = Math.max(0, x - dist);
    const maxX = Math.min(BOARD_SIZE - 1, x + dist);
    const minY = Math.max(0, y - dist);
    const maxY = Math.min(BOARD_SIZE - 1, y + dist);

    for (let cy = minY; cy <= maxY; cy++) {
        for (let cx = minX; cx <= maxX; cx++) {
            if (board[cy * BOARD_SIZE + cx] !== EMPTY) return true;
        }
    }
    return false;
}

// Evaluate a point for a specific color (how good is this spot for 'color')
function evaluatePoint(board: number[], x: number, y: number, color: number): number {
    let totalScore = 0;

    // Check all 4 directions
    // Horizontal, Vertical, Diagonal 1 (\), Diagonal 2 (/)
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
        totalScore += evaluateDirection(board, x, y, dx, dy, color);
    }

    return totalScore;
}

function evaluateDirection(board: number[], x: number, y: number, dx: number, dy: number, color: number): number {
    // We look at the line formed by placing stone at (x,y)
    // We look 4 steps back and 4 steps forward to see the pattern formed

    let count = 1; // The stone itself
    let blockStart = false; // Is the "start" side blocked?
    let blockEnd = false;   // Is the "end" side blocked?

    // Check Forward
    let i = 1;
    while (true) {
        const cx = x + dx * i;
        const cy = y + dy * i;
        if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
            blockEnd = true;
            break;
        }
        const cell = board[cy * BOARD_SIZE + cx];
        if (cell === color) {
            count++;
        } else if (cell === EMPTY) {
            break; // Stop at empty (but remember it's open)
        } else {
            blockEnd = true; // Blocked by opponent
            break;
        }
        i++;
    }

    // Check Backward
    let j = 1;
    while (true) {
        const cx = x - dx * j;
        const cy = y - dy * j;
        if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
            blockStart = true;
            break;
        }
        const cell = board[cy * BOARD_SIZE + cx];
        if (cell === color) {
            count++;
        } else if (cell === EMPTY) {
            break;
        } else {
            blockStart = true;
            break;
        }
        j++;
    }

    // Score based on count and blocks
    if (count >= 5) return SCORES.WIN;

    if (count === 4) {
        if (!blockStart && !blockEnd) return SCORES.OPEN_4;
        if (!blockStart || !blockEnd) return SCORES.CLOSED_4;
        return 0; // Completely blocked 4 is useless (unless >5 wins, but usually standard gomoku)
    }

    if (count === 3) {
        if (!blockStart && !blockEnd) {
            // Need to check if next to empty is truly playable for Open 3?
            // Simple heuristic: yes.
            return SCORES.OPEN_3;
        }
        if (!blockStart || !blockEnd) return SCORES.CLOSED_3;
        return 0;
    }

    if (count === 2) {
        if (!blockStart && !blockEnd) return SCORES.OPEN_2;
        if (!blockStart || !blockEnd) return SCORES.CLOSED_2;
        return 0;
    }

    if (count === 1) {
        return 0; // Single stone usually negligible unless advanced spacing check
    }

    return 0;
}
