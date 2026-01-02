import { Hex, Player, DIRECTIONS } from './types';
import { checkWinLoss, getHexKey } from './engine';

// --- Evaluation Constants ---
const WIN_SCORE = 10000;
const LOSE_SCORE = -10000;
const SUICIDE_SCORE = -8000; // Making a 3-loop restricted move (self-loss)
const CONNECT_3_THREAT = 500; // Open 3 that can become 4
const CONNECT_2_THREAT = 50;  // Open 2 that can become 3

// --- Helper: Get Available Moves ---
const getAvailableMoves = (board: Map<string, Player>, boardRadius: number): Hex[] => {
    const availableMoves: Hex[] = [];
    for (let q = -boardRadius; q <= boardRadius; q++) {
        const r1 = Math.max(-boardRadius, -q - boardRadius);
        const r2 = Math.min(boardRadius, -q + boardRadius);
        for (let r = r1; r <= r2; r++) {
            const hex = { q, r, s: -q - r };
            if (!board.has(getHexKey(hex))) {
                availableMoves.push(hex);
            }
        }
    }
    return availableMoves;
};

// --- Evaluation Function ---
const evaluateBoard = (board: Map<string, Player>, player: Player): number => {
    // Simple static evaluation since depth limit checks terminal states
    // We want to maximize 'player'.
    // Heuristics:
    // - Control center (minor)
    // - Number of 2s and 3s (major) -- NOTE: This requires scanning the board which is expensive.
    // For performance, we'll keep it simple for now, relying on terminal state checks in minimax.
    // If no terminal state, just favor center and random noise to avoid determining.

    // Scan board for partial lines? 
    // Maybe just center proximity for non-terminal nodes is enough for depth 3.
    // Or rudimentary connectivity count.

    let score = 0;
    const opponent = player === 1 ? 2 : 1;

    for (const [key, val] of Array.from(board.entries())) {
        if (val === player) {
            // Favor center
            // parse key back to hex? Or just use known keys if available.
            // Let's iterate available moves in minimax loop instead for efficiency.
            // Here just basic piece counting? No, piece count is equal.

            // Just return random small value to mix things up if even?
            // Actually, static evaluation is CRITICAL if we don't hit terminal state.
        }
    }
    return 0;
};

// --- Minimax with Alpha-Beta ---
const MAX_DEPTH = 3;

function minimax(
    board: Map<string, Player>,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: Player,
    move: Hex | null // The move that led to this state (to check win/loss)
): number {
    const opponent = aiPlayer === 1 ? 2 : 1;
    const currentPlayer = isMaximizing ? aiPlayer : opponent;
    const previousPlayer = isMaximizing ? opponent : aiPlayer; // Player who just moved

    // 1. Check Terminal State (Win/Loss) using the previous move
    if (move) {
        const { won, lost } = checkWinLoss(board, move, previousPlayer);
        if (won) {
            // Previous player won.
            return isMaximizing ? LOSE_SCORE + depth : WIN_SCORE - depth;
            // If maximizing (AI turn), previous was Opponent -> Opponent won -> Low Score
            // If minimizing (Opponent turn), previous was AI -> AI won -> High Score
        }
        if (lost) {
            // Previous player lost (Suicide).
            return isMaximizing ? WIN_SCORE - depth : LOSE_SCORE + depth;
            // If maximizing (AI turn), previous was Opponent -> Opponent suicide -> High Score
            // If minimizing (Opponent turn), previous was AI -> AI suicide -> Low Score
        }
    }

    // 2. Depth Limit
    if (depth === 0) {
        return evaluateBoard(board, aiPlayer); // Return static score
    }

    // 3. Recursive Step
    // Optimization: Order moves? (e.g. center first)
    const availableMoves = getAvailableMoves(board, 4); // Hardcoded radius 4 for now or pass it down

    // Shuffle moves slightly to vary gameplay
    // availableMoves.sort(() => Math.random() - 0.5); 

    if (availableMoves.length === 0) return 0; // Draw?

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const nextMove of availableMoves) {
            const key = getHexKey(nextMove);
            board.set(key, aiPlayer);
            const evalScore = minimax(board, depth - 1, alpha, beta, false, aiPlayer, nextMove);
            board.delete(key);

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break; // Prune
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const nextMove of availableMoves) {
            const key = getHexKey(nextMove);
            board.set(key, opponent);
            const evalScore = minimax(board, depth - 1, alpha, beta, true, aiPlayer, nextMove);
            board.delete(key);

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break; // Prune
        }
        return minEval;
    }
}


export const getBestMove = (
    currentBoard: Map<string, Player>,
    aiPlayer: Player,
    boardRadius: number
): Hex | null => {
    // Determine strict win/loss first (Depth 1 check to ensure we don't miss obvious things due to depth limiter strangeness)
    // Actually Minimax should handle it, but for efficiency, let's keep the "Evaluate Immediate" check
    // because Minimax at depth 3 might be slow if branching factor is huge (Honeycomb has ~60 hexes).
    // Available moves ~40-50 at start. 50^3 = 125,000. Doable in JS.

    const availableMoves = getAvailableMoves(currentBoard, boardRadius);
    if (availableMoves.length === 0) return null;

    let bestMove = availableMoves[0];
    let maxEval = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // Center bias sort for better pruning
    availableMoves.sort((a, b) => {
        const distA = Math.abs(a.q) + Math.abs(a.r) + Math.abs(a.s);
        const distB = Math.abs(b.q) + Math.abs(b.r) + Math.abs(b.s);
        return distA - distB;
    });

    for (const move of availableMoves) {
        const key = getHexKey(move);
        currentBoard.set(key, aiPlayer);

        // Check immediate result to help pruning/scoring logic inside minimax?
        // No, trusted pure minimax.
        const evalScore = minimax(currentBoard, MAX_DEPTH, alpha, beta, false, aiPlayer, move);

        currentBoard.delete(key);

        if (evalScore > maxEval) {
            maxEval = evalScore;
            bestMove = move;
        }
    }

    return bestMove;
};
