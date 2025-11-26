import { GameState, Player, Move } from './types';
import { getValidMoves, move } from './engine';

const MAX_DEPTH = 5;

const PIECE_VALUES = {
    king: 500,
    man: 100,
};

export function getBestMove(state: GameState, player: Player): Move | null {
    const validMoves = getValidMoves(state, player);
    if (validMoves.length === 0) return null;

    // If only one move (mandatory jump), take it immediately
    if (validMoves.length === 1) return validMoves[0];

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    // Sort moves to improve pruning (Jumps first)
    validMoves.sort((a, b) => (b.isJump ? 1 : 0) - (a.isJump ? 1 : 0));

    for (const m of validMoves) {
        const nextState = move(state, m);

        const score = minimax(nextState, MAX_DEPTH - 1, -Infinity, Infinity, nextState.turn === player, player);
        if (score > bestScore) {
            bestScore = score;
            bestMove = m;
        }
    }

    return bestMove;
}

function minimax(state: GameState, depth: number, alpha: number, beta: number, isMaximizing: boolean, rootPlayer: Player): number {
    if (state.winner === rootPlayer) return 10000 + depth;
    if (state.winner && state.winner !== rootPlayer) return -10000 - depth;
    if (depth === 0) return evaluate(state, rootPlayer);

    const currentPlayer = state.turn;
    const validMoves = getValidMoves(state, currentPlayer);

    if (validMoves.length === 0) {
        // No moves = Loss for current player
        return currentPlayer === rootPlayer ? -10000 : 10000;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const m of validMoves) {
            const nextState = move(state, m);
            // If turn stays same (multi-jump), we are still maximizing
            const nextIsMaximizing = nextState.turn === rootPlayer;
            const evalScore = minimax(nextState, depth - 1, alpha, beta, nextIsMaximizing, rootPlayer);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const m of validMoves) {
            const nextState = move(state, m);
            const nextIsMaximizing = nextState.turn === rootPlayer;
            const evalScore = minimax(nextState, depth - 1, alpha, beta, nextIsMaximizing, rootPlayer);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluate(state: GameState, player: Player): number {
    let score = 0;
    const opponent = player === 'red' ? 'black' : 'red';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = state.board[r][c];
            if (p) {
                let val = PIECE_VALUES[p.type];

                // Position bonuses
                // Center control
                if (c >= 2 && c <= 5 && r >= 2 && r <= 5) val += 10;

                // Advancement (for Men)
                if (p.type === 'man') {
                    const advancement = p.owner === 'red' ? (7 - r) : r;
                    val += advancement * 5;
                }

                // Safe back rank (prevent promotion)
                if (p.type === 'man') {
                    if (p.owner === 'red' && r === 7) val += 20;
                    if (p.owner === 'black' && r === 0) val += 20;
                }

                score += p.owner === player ? val : -val;
            }
        }
    }

    return score;
}
