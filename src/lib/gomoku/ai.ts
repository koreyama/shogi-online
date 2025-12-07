import { BoardState, Player, Move, BOARD_SIZE } from './types';
import { isValidMove } from './engine';

const MAX_DEPTH = 2; // Performance consideration

// Evaluation Scores
const SCORES = {
    WIN: 1000000,
    LIVE_FOUR: 100000, // 011110 - Unstoppable unless immediate block
    DEAD_FOUR: 10000,  // x11110 - Must block
    LIVE_THREE: 10000, // 01110 - Major threat
    DEAD_THREE: 1000,
    LIVE_TWO: 100,
    DEAD_TWO: 10
};

export const getBestMove = (board: BoardState, player: Player): Move | null => {
    // 1. If board is empty, play center
    let stoneCount = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== null) stoneCount++;
        }
    }
    if (stoneCount === 0) {
        return { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2), player };
    }

    // 2. Candidate generation (nearby stones)
    const candidates = getCandidateMoves(board);
    if (candidates.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove: Move | null = null;
    let alpha = -Infinity;
    let beta = Infinity;

    // 3. Simple Minimax with Alpha-Beta
    for (const move of candidates) {
        const newBoard = board.map(row => [...row]);
        newBoard[move.y][move.x] = player;

        // Check instant win
        if (evaluateBoard(newBoard, player) >= SCORES.WIN) {
            return { x: move.x, y: move.y, player };
        }

        const score = minimax(newBoard, MAX_DEPTH - 1, false, alpha, beta, player);

        if (score > bestScore) {
            bestScore = score;
            bestMove = { x: move.x, y: move.y, player };
        }
        alpha = Math.max(alpha, bestScore);
    }

    return bestMove || { x: candidates[0].x, y: candidates[0].y, player };
};

const getCandidateMoves = (board: BoardState): { x: number, y: number }[] => {
    const candidates: { x: number, y: number }[] = [];
    const visited = new Set<string>();

    // Optimization: Only check cells within 2 steps of existing stones
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== null) {
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < BOARD_SIZE && nx >= 0 && nx < BOARD_SIZE && board[ny][nx] === null) {
                            const key = `${nx},${ny}`;
                            if (!visited.has(key)) {
                                candidates.push({ x: nx, y: ny });
                                visited.add(key);
                            }
                        }
                    }
                }
            }
        }
    }
    // If no candidates found (shouldn't happen if board not empty), pick center of empty
    if (candidates.length === 0) {
        if (board[7][7] === null) candidates.push({ x: 7, y: 7 });
    }

    return candidates;
};

const minimax = (
    board: BoardState,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    player: Player
): number => {
    const opponent = player === 'black' ? 'white' : 'black';
    const currentScore = evaluateBoard(board, player);

    if (Math.abs(currentScore) >= SCORES.WIN / 2) return currentScore;
    if (depth === 0) return currentScore;

    const candidates = getCandidateMoves(board);
    if (candidates.length === 0) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of candidates) {
            const newBoard = board.map(row => [...row]);
            newBoard[move.y][move.x] = player;
            const evalScore = minimax(newBoard, depth - 1, false, alpha, beta, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of candidates) {
            const newBoard = board.map(row => [...row]);
            newBoard[move.y][move.x] = opponent;
            const evalScore = minimax(newBoard, depth - 1, true, alpha, beta, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

// --- Evaluation Logic ---

const evaluateBoard = (board: BoardState, player: Player): number => {
    const opponent = player === 'black' ? 'white' : 'black';
    let myScore = evaluatePlayer(board, player);
    let oppScore = evaluatePlayer(board, opponent);

    // Defense is slightly more important if opponent has high threat
    if (oppScore >= SCORES.LIVE_FOUR) oppScore *= 1.2;
    if (oppScore >= SCORES.LIVE_THREE) oppScore *= 1.1;

    return myScore - oppScore;
};

const evaluatePlayer = (board: BoardState, player: Player): number => {
    let score = 0;
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 },
    ];

    // Scan all 4 directions for every cell to identify sequences
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === player) {
                for (const { dx, dy } of directions) {
                    // Check if this stone is the start of a sequence (previous is not player)
                    // This avoids double counting 1-1-1-1-1 as 5 separate things
                    const px = x - dx;
                    const py = y - dy;
                    if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE && board[py][px] === player) {
                        continue;
                    }

                    score += evaluateSequence(board, x, y, dx, dy, player);
                }
            }
        }
    }
    return score;
};

const evaluateSequence = (board: BoardState, x: number, y: number, dx: number, dy: number, player: Player): number => {
    let count = 0;
    let openEnds = 0;

    // Scan forward to find length
    let i = 0;
    while (true) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || board[ny][nx] !== player) {
            break;
        }
        count++;
        i++;
    }

    // Check ends
    // Start side (x-dx, y-dy)
    const sx = x - dx;
    const sy = y - dy;
    if (sx >= 0 && sx < BOARD_SIZE && sy >= 0 && sy < BOARD_SIZE && board[sy][sx] === null) {
        openEnds++;
    }

    // End side (x + dx*count, y + dy*count)
    const ex = x + dx * count;
    const ey = y + dy * count;
    if (ex >= 0 && ex < BOARD_SIZE && ey >= 0 && ey < BOARD_SIZE && board[ey][ex] === null) {
        openEnds++;
    }

    if (count >= 5) return SCORES.WIN;
    if (count === 4) {
        if (openEnds === 2) return SCORES.LIVE_FOUR;
        if (openEnds === 1) return SCORES.DEAD_FOUR;
    }
    if (count === 3) {
        if (openEnds === 2) return SCORES.LIVE_THREE;
        if (openEnds === 1) return SCORES.DEAD_THREE;
    }
    if (count === 2) {
        if (openEnds === 2) return SCORES.LIVE_TWO;
    }

    return 0;
};
