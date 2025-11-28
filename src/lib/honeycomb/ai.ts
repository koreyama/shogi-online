export type Hex = { q: number; r: number; s: number };
export type Player = 1 | 2;

const DIRECTIONS = [
    { q: 1, r: 0, s: -1 }, { q: 1, r: -1, s: 0 }, { q: 0, r: -1, s: 1 },
    { q: -1, r: 0, s: 1 }, { q: -1, r: 1, s: 0 }, { q: 0, r: 1, s: -1 }
];

const getHexKey = (hex: Hex) => `${hex.q},${hex.r},${hex.s}`;

// Check line length for a specific player starting from a hex in a direction
const countLine = (board: Map<string, Player>, start: Hex, dir: Hex, player: Player): number => {
    let count = 0;
    let current = { ...start };
    while (board.get(getHexKey(current)) === player) {
        count++;
        current = { q: current.q + dir.q, r: current.r + dir.r, s: current.s + dir.s };
    }
    return count;
};

// Evaluate a move result
// Returns:
// 2: Win (Connect 4)
// 1: Normal
// -1: Loss (Connect 3)
const evaluateMoveResult = (board: Map<string, Player>, move: Hex, player: Player): number => {
    // Temporarily add move
    const key = getHexKey(move);
    board.set(key, player);

    let maxCount = 0;
    let isLoss = false;

    // Check all 3 axes
    const axes = [
        { q: 1, r: 0, s: -1 },
        { q: 0, r: 1, s: -1 },
        { q: 1, r: -1, s: 0 }
    ];

    for (const axis of axes) {
        // Count consecutive including the new piece
        // We need to check both directions from the placed piece
        let count = 1;

        // Forward
        let curr = { q: move.q + axis.q, r: move.r + axis.r, s: move.s + axis.s };
        while (board.get(getHexKey(curr)) === player) {
            count++;
            curr = { q: curr.q + axis.q, r: curr.r + axis.r, s: curr.s + axis.s };
        }

        // Backward
        curr = { q: move.q - axis.q, r: move.r - axis.r, s: move.s - axis.s };
        while (board.get(getHexKey(curr)) === player) {
            count++;
            curr = { q: curr.q - axis.q, r: curr.r - axis.r, s: curr.s - axis.s };
        }

        if (count >= 4) {
            maxCount = Math.max(maxCount, count);
        } else if (count === 3) {
            isLoss = true;
        }
    }

    // Remove temp move
    board.delete(key);

    if (maxCount >= 4) return 2; // Win takes precedence
    if (isLoss) return -1; // Loss
    return 1; // Neutral
};

export const getBestMove = (
    currentBoard: Map<string, Player>,
    aiPlayer: Player,
    boardRadius: number
): Hex | null => {
    const opponent = aiPlayer === 1 ? 2 : 1;
    const availableMoves: Hex[] = [];

    // Generate all available moves
    for (let q = -boardRadius; q <= boardRadius; q++) {
        const r1 = Math.max(-boardRadius, -q - boardRadius);
        const r2 = Math.min(boardRadius, -q + boardRadius);
        for (let r = r1; r <= r2; r++) {
            const hex = { q, r, s: -q - r };
            if (!currentBoard.has(getHexKey(hex))) {
                availableMoves.push(hex);
            }
        }
    }

    if (availableMoves.length === 0) return null;

    // 1. Check for Winning Moves
    for (const move of availableMoves) {
        const result = evaluateMoveResult(currentBoard, move, aiPlayer);
        if (result === 2) return move; // Win immediately
    }

    // 2. Check for Blocking Opponent Wins
    // If opponent plays here, do they win?
    for (const move of availableMoves) {
        const result = evaluateMoveResult(currentBoard, move, opponent);
        if (result === 2) {
            // Opponent wins if they play here. We MUST block.
            // But wait, does blocking cause US to lose (Connect 3)?
            const myResult = evaluateMoveResult(currentBoard, move, aiPlayer);
            if (myResult !== -1) {
                return move; // Block safely
            }
            // If blocking causes us to lose, we are in trouble. 
            // But usually blocking a win is better than losing immediately? 
            // No, if we play here we lose (Connect 3). If we don't, they win (Connect 4).
            // Either way game over. But maybe we can win elsewhere?
            // We already checked for our wins in step 1. So we can't win elsewhere.
            // So we lose either way. Let's block anyway to extend game?
            // Or maybe avoiding self-loss is better?
            // Let's prioritize NOT losing ourselves first?
            // Actually, if opponent wins next turn, we lose.
            // If we commit suicide (Connect 3), we lose NOW.
            // Losing next turn is better than losing now (maybe opponent makes mistake).
            // So, avoid self-loss is higher priority than blocking?
            // But if we don't block, they win 100%.
            // Let's stick to: Block if safe.
        }
    }

    // 3. Filter out Losing Moves (Connect 3)
    const safeMoves = availableMoves.filter(move => {
        return evaluateMoveResult(currentBoard, move, aiPlayer) !== -1;
    });

    if (safeMoves.length === 0) {
        // All moves lead to loss. Just pick random one from available.
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // 4. Heuristics on Safe Moves
    // - Prefer center
    // - Prefer clustering (near own pieces)
    // - Try to force opponent into bad spots? (Too complex for now)

    let bestScore = -Infinity;
    let bestMove = safeMoves[0];

    for (const move of safeMoves) {
        let score = 0;

        // Distance from center (prefer center)
        const dist = (Math.abs(move.q) + Math.abs(move.r) + Math.abs(move.s)) / 2;
        score -= dist * 10; // Penalty for distance

        // Clustering: Count neighbors
        for (const dir of DIRECTIONS) {
            const neighbor = { q: move.q + dir.q, r: move.r + dir.r, s: move.s + dir.s };
            const neighborVal = currentBoard.get(getHexKey(neighbor));
            if (neighborVal === aiPlayer) {
                score += 20; // Good to connect
            } else if (neighborVal === opponent) {
                score += 10; // Good to block/interfere
            }
        }

        // Random factor to avoid repetition
        score += Math.random() * 5;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};
