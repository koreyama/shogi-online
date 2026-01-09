import { Hex, Player } from './types';
import { checkWinLoss, getHexKey } from './engine';

// --- Evaluation Constants ---
const SCORES = {
    WIN: 1000000,
    LOSE: -1000000,
    OPEN_3: 50000, // Threat to make 4
    OPEN_2: 1000,
    CENTER_BONUS: 10
};

// --- Time Management ---
const TIME_LIMIT_MS = 800;
const YIELD_INTERVAL_MS = 15;

const shouldYield = (() => {
    let lastYield = performance.now();
    return () => {
        const now = performance.now();
        if (now - lastYield > YIELD_INTERVAL_MS) {
            lastYield = now;
            return true;
        }
        return false;
    };
})();

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// --- API ---

export async function getBestMove(
    currentBoard: Map<string, Player>,
    aiPlayer: Player,
    boardRadius: number
): Promise<Hex | null> {
    const startTime = performance.now();
    const availableMoves = getAvailableMoves(currentBoard, boardRadius);
    if (availableMoves.length === 0) return null;

    // Center start preference
    if (currentBoard.size === 0) return { q: 0, r: 0, s: 0 };

    // 0. QUICK CHECK: Forced Moves (Win or Block Loss) - Synchronous & Instant
    // Priority 1: Can I win immediately?
    for (const move of availableMoves) {
        if (checkImmediateWin(currentBoard, move, aiPlayer)) {
            console.log("HoneyAI: Found Winning Move", move);
            return move;
        }
    }
    // Priority 2: Must I block a loss? (Opponent will win or I am forced into bad state?)
    // In Honeycomb, "Loss" is creating a 3-in-a-row (Suicide).
    // BUT, traditionally, we also need to block opponent from making 4.
    // Wait, the rules: "Make 3 -> LOSE". "Make 4 -> WIN".
    // So if opponent has 3 in a row (and hasn't lost yet? Impossible, making 3 loses).
    // Ah, opponent has 3 stones *scattered*? No.
    // If opponent has 3 in a line, they ALREADY LOST.
    // So we shield against opponent making 4.
    // Wait, if opponent makes 4, they win. So if opponent has 3 in a line... NO.
    // If opponent has 3 in a line, they lost.
    // So opponent will never voluntarily make 3.
    // Opponent wants to make 4.
    // So if opponent has "3 in a line" pattern WITHOUT being a connected 3?
    // i.e. X X _ X.  Filling the gap makes 4 -> Win.
    // So we must block spots that give opponent 4.

    // Also, we must avoid spots that give US 3 (Suicide).

    // Let's filter available moves to remove SUICIDE moves (unless it also makes 4, which overrides loss?)
    // Game rules: "4 in a row wins". "3 in a row loses".
    // Usually Win > Loss check order?
    // checkWinLoss returns { won, lost }. 
    // If won=true, we don't care about lost.

    const safeMoves = availableMoves.filter(move => {
        const { won, lost } = checkWinLoss(currentBoard, move, aiPlayer);
        if (won) return true; // Winning moves are always safe/good
        if (lost) return false; // Non-winning suicide moves are bad
        return true;
    });

    if (safeMoves.length === 0) {
        // Only suicide moves left? Return one.
        return availableMoves[0];
    }

    // Check blocking: Does opponent have a winning move?
    const opponent = aiPlayer === 1 ? 2 : 1;
    for (const move of safeMoves) {
        // If opponent played here, would they win?
        // Note: We don't care if opponent suicides here. We want to block their WIN.
        const { won } = checkWinLoss(currentBoard, move, opponent);
        if (won) {
            console.log("HoneyAI: Forced Block", move);
            return move;
        }
    }

    // 1. Iterative Deepening Search
    let bestMove = safeMoves[0];
    let maxDepthReached = 0;

    // Sort moves by distance to center
    safeMoves.sort((a, b) => {
        const distA = Math.abs(a.q) + Math.abs(a.r);
        const distB = Math.abs(b.q) + Math.abs(b.r);
        return distA - distB;
    });

    for (let depth = 2; depth <= 4; depth++) {
        try {
            if (performance.now() - startTime > TIME_LIMIT_MS) break;

            const result = await minimaxRoot(currentBoard, safeMoves, depth, aiPlayer, startTime);
            if (result.move) bestMove = result.move;
            maxDepthReached = depth;

            // If inevitable win found
            if (result.score >= SCORES.WIN - 100) break;

        } catch (e) {
            break;
        }
    }

    console.log(`HoneyAI: Finished Depth ${maxDepthReached}, Time ${(performance.now() - startTime).toFixed(0)}ms`);
    return bestMove;
}

// --- Search Logic ---

async function minimaxRoot(
    board: Map<string, Player>,
    moves: Hex[],
    depth: number,
    player: Player,
    startTime: number
): Promise<{ move: Hex | null, score: number }> {
    let bestScore = -Infinity;
    let bestMove = moves[0];
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of moves) {
        // Yield check
        if (shouldYield()) await yieldToMain();
        if (performance.now() - startTime > TIME_LIMIT_MS) throw new Error("Timeout");

        const key = getHexKey(move);
        board.set(key, player);

        const score = - (await minimax(board, depth - 1, -beta, -alpha, player === 1 ? 2 : 1, startTime));

        board.delete(key);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) alpha = score;
    }

    return { move: bestMove, score: bestScore };
}

async function minimax(
    board: Map<string, Player>,
    depth: number,
    alpha: number,
    beta: number,
    player: Player, // The player whose turn it is at this node
    startTime: number
): Promise<number> {
    // Evaluation at leaf
    if (depth === 0) {
        return evaluateBoard(board, player);
    }

    // Get moves
    // Note: We need to filter for suicide moves here too? 
    // Yes, a smart AI assumes opponent won't suicide unless forced.
    // However, generating moves and checkWinLoss every time is heavy.
    // For depth 3/4 it might be ok.

    const opponent = player === 1 ? 2 : 1;
    const allMoves = getAvailableMoves(board, 4); // Radius 4 fixed

    let validMoves: Hex[] = [];

    // Filter moves: Check if this move ends the game.
    for (const move of allMoves) {
        const { won, lost } = checkWinLoss(board, move, player);
        if (won) {
            return SCORES.WIN + depth; // Win immediately prefered
        }
        if (lost) {
            // Suicide. Prune this move unless it's the only one?
            // If all moves are suicide, we lose.
            continue;
        }
        validMoves.push(move);
    }

    if (validMoves.length === 0) {
        // All moves were suicide or no moves left.
        return SCORES.LOSE - depth;
    }

    // Heuristic sort? Skip for speed in inner loop.

    let bestScore = -Infinity;

    for (const move of validMoves) {
        // Yield occasionally
        if (shouldYield()) await yieldToMain();
        if (performance.now() - startTime > TIME_LIMIT_MS) throw new Error("Timeout");

        const key = getHexKey(move);
        board.set(key, player);

        const score = - (await minimax(board, depth - 1, -beta, -alpha, opponent, startTime));

        board.delete(key);

        if (score > bestScore) bestScore = score;
        if (score > alpha) alpha = score;
        if (alpha >= beta) break;
    }

    return bestScore;
}

// --- Helpers ---

function getAvailableMoves(board: Map<string, Player>, boardRadius: number): Hex[] {
    const moves: Hex[] = [];
    // Optimization: Only check neighbors of existing pieces?
    // Global scan for radius 4 is ~61 hexes. It's fast enough.
    const startMoved = board.size > 0;

    for (let q = -boardRadius; q <= boardRadius; q++) {
        const r1 = Math.max(-boardRadius, -q - boardRadius);
        const r2 = Math.min(boardRadius, -q + boardRadius);
        for (let r = r1; r <= r2; r++) {
            const hex = { q, r, s: -q - r };
            const key = getHexKey(hex);
            if (!board.has(key)) {
                // If board has pieces, maybe prioritize neighbors?
                // For now, return all empty.
                moves.push(hex);
            }
        }
    }
    return moves;
}

function checkImmediateWin(board: Map<string, Player>, move: Hex, player: Player): boolean {
    const { won } = checkWinLoss(board, move, player);
    return won;
}

// Evaluate board for 'player' relative to opponent
function evaluateBoard(board: Map<string, Player>, player: Player): number {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;

    // Iterate all pieces to find partial lines
    // This is computationally heavy.
    // Simplified Evaluation:
    // 1. Center Control
    // 2. Connectivity (neighbors)

    for (const [key, val] of Array.from(board.entries())) {
        const parts = key.split(',').map(Number);
        const hex = { q: parts[0], r: parts[1], s: parts[2] };

        const isMe = val === player;
        const multiplier = isMe ? 1 : -1;

        // Center Bonus
        const dist = Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s);
        score += (10 - dist) * multiplier * 10;

        // Neighbor bonus (Connectivity)
        // Check 6 directions
        /*
        const neighbors = [
            {q:1, r:0, s:-1}, {q:1, r:-1, s:0}, {q:0, r:-1, s:1},
            {q:-1, r:0, s:1}, {q:-1, r:1, s:0}, {q:0, r:1, s:-1}
        ];
        let connectionCount = 0;
        for(const n of neighbors) {
            const nKey = getHexKey({q: hex.q + n.q, r: hex.r + n.r, s: hex.s + n.s});
            if (board.get(nKey) === val) connectionCount++;
        }
        score += connectionCount * multiplier * 50;
        */

        // Better: Scan lines passing through this hex?
        // Too slow for leaf.
    }

    return score;
}
