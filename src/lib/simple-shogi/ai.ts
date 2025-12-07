import { GameState, Player, PieceType } from './types';
import { getValidMoves, move } from './engine';

const MAX_DEPTH = 6; // Small board allows deeper search

const PIECE_VALUES: Record<PieceType, number> = {
    king: 10000,
    gold: 1000,
    rook: 800,
    bishop: 800,
    pawn: 100,
};

export function getBestMove(state: GameState, player: Player): any {
    const validMoves = getValidMoves(state, player);
    if (validMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    // Simple ordering
    validMoves.sort((a, b) => {
        const targetA = state.board[a.to.r][a.to.c];
        const targetB = state.board[b.to.r][b.to.c];
        const valA = targetA ? PIECE_VALUES[targetA.type] : 0;
        const valB = targetB ? PIECE_VALUES[targetB.type] : 0;
        return valB - valA;
    });

    for (const m of validMoves) {
        const nextState = move(state, m);
        const score = minimax(nextState, MAX_DEPTH - 1, -Infinity, Infinity, false, player);
        if (score > bestScore) {
            bestScore = score;
            bestMove = m;
        }
    }

    return bestMove;
}

function minimax(state: GameState, depth: number, alpha: number, beta: number, isMaximizing: boolean, player: Player): number {
    if (state.winner === player) return 100000 + depth;
    if (state.winner && state.winner !== player) return -100000 - depth;
    if (depth === 0) return evaluate(state, player);

    const currentPlayer = isMaximizing ? player : (player === 'sente' ? 'gote' : 'sente');
    const validMoves = getValidMoves(state, currentPlayer);

    if (validMoves.length === 0) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const m of validMoves) {
            const nextState = move(state, m);
            const evalScore = minimax(nextState, depth - 1, alpha, beta, false, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const m of validMoves) {
            const nextState = move(state, m);
            const evalScore = minimax(nextState, depth - 1, alpha, beta, true, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluate(state: GameState, player: Player): number {
    let score = 0;
    const opponent = player === 'sente' ? 'gote' : 'sente';

    // Material
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            const p = state.board[r][c];
            if (p) {
                let val = PIECE_VALUES[p.type];

                // Incentivize Try (King advancement)
                if (p.type === 'king') {
                    if (p.owner === 'sente') {
                        // Sente wants to go to row 0. 
                        // Row 3 (start) -> 0 bonus
                        // Row 2 -> +200
                        // Row 1 -> +500
                        // Row 0 -> Win (handled by win check, but bias helps)
                        val += (3 - r) * 300;
                    } else {
                        // Gote wants to go to row 3.
                        val += r * 300;
                    }
                }

                score += p.owner === player ? val : -val;
            }
        }
    }

    // Hand
    for (const type of Object.keys(state.hands[player]) as PieceType[]) {
        score += (state.hands[player][type] || 0) * PIECE_VALUES[type] * 1.1;
    }
    for (const type of Object.keys(state.hands[opponent]) as PieceType[]) {
        score -= (state.hands[opponent][type] || 0) * PIECE_VALUES[type] * 1.1;
    }

    return score;
}
