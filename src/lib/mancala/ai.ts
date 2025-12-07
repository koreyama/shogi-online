import { GameState, Player, FIRST_STORE, SECOND_STORE, PITS_PER_PLAYER } from './types';
import { executeMove, isValidMove } from './engine';

const MAX_DEPTH = 6; // Increased depth for better lookahead

export const getBestMove = (state: GameState, player: Player): number | null => {
    const validMoves = getValidMoves(state);
    if (validMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    // Order moves to improve pruning?
    // Start with moves that end in store (rightmost usually?)
    // For now just search.

    for (const move of validMoves) {
        const newState = executeMove(state, move);

        // Depth Control: If turn remains same (Extra Turn), do not reduce depth
        const isExtraTurn = newState.turn === state.turn && !newState.isGameOver;
        const nextDepth = isExtraTurn ? MAX_DEPTH : MAX_DEPTH - 1;

        const score = minimax(newState, nextDepth, !isExtraTurn, -Infinity, Infinity, player);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};

const getValidMoves = (state: GameState): number[] => {
    const moves: number[] = [];
    const start = state.turn === 'first' ? 0 : FIRST_STORE + 1;
    const end = state.turn === 'first' ? PITS_PER_PLAYER : SECOND_STORE;

    for (let i = start; i < end; i++) {
        if (isValidMove(state, i)) {
            moves.push(i);
        }
    }
    // Reverse order might be better for alpha-beta (checking right-most pits first often yields extra turns)
    return moves.reverse();
};

const minimax = (
    state: GameState,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    player: Player
): number => {
    if (state.isGameOver || depth <= 0) {
        return evaluate(state, player);
    }

    const currentTurnPlayer = state.turn;
    const isMyTurn = currentTurnPlayer === player;

    // In Mancala, "Minimizing" isn't always opponent's turn because of extra turns.
    // We strictly track if the current state node allows ME to move (Maximize) or OPPONENT (Minimize).
    // The passed `isMaximizing` flag helps track "logical" depth layers but `state.turn` is truth.

    // Actually standard minimax: 
    // If state.turn == player -> Maximize
    // If state.turn != player -> Minimize

    const nodeIsMaximizing = state.turn === player;

    const validMoves = getValidMoves(state);

    if (nodeIsMaximizing) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const newState = executeMove(state, move);
            // Extra Turn Check
            const isExtraTurn = newState.turn === state.turn && !newState.isGameOver;
            // Reduce depth only if turn changes, or maybe always reduce slightly to prevent infinite?
            // Let's reduce by 1 normally, but 0 if extra turn.
            // Safety: limit max depth extension? MaxDepth is strictly decremented to avoid infinite loops in bad logic.
            // But here let's try standard decay:
            const newDepth = isExtraTurn ? depth : depth - 1;

            const evalScore = minimax(newState, newDepth, true, alpha, beta, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const newState = executeMove(state, move);
            const isExtraTurn = newState.turn === state.turn && !newState.isGameOver;
            const newDepth = isExtraTurn ? depth : depth - 1;

            const evalScore = minimax(newState, newDepth, false, alpha, beta, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

const evaluate = (state: GameState, player: Player): number => {
    const myStoreIndex = player === 'first' ? FIRST_STORE : SECOND_STORE;
    const oppStoreIndex = player === 'first' ? SECOND_STORE : FIRST_STORE;

    const myStore = state.board[myStoreIndex];
    const oppStore = state.board[oppStoreIndex];

    let score = (myStore - oppStore) * 100;

    // Bonus for stones on my side (potential score)?
    // Or maybe keeping stones on my side is good for defense?
    // Actually, "stones in store" is the only thing that matters for winning.
    // But having mobility (moves available) is good.

    // Basic heuristic: Store Diff implies winning.

    return score;
};
