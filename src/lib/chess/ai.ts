import { GameState, Player, Move, BOARD_SIZE, PieceType } from './types';
import { executeMove, isValidMove } from './engine';

const MAX_DEPTH = 2;

const PIECE_VALUES: Record<PieceType, number> = {
    pawn: 10,
    knight: 30,
    bishop: 30,
    rook: 50,
    queen: 90,
    king: 900,
};

export const getBestMove = (state: GameState, player: Player): Move | null => {
    const validMoves = getAllValidMoves(state, player);
    if (validMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const move of validMoves) {
        const newState = executeMove(state, move.from, move.to);
        const score = minimax(newState, MAX_DEPTH - 1, false, -Infinity, Infinity, player);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};

const getAllValidMoves = (state: GameState, player: Player): Move[] => {
    const moves: Move[] = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const p = state.board[y][x];
            if (p && p.player === player) {
                for (let dy = 0; dy < BOARD_SIZE; dy++) {
                    for (let dx = 0; dx < BOARD_SIZE; dx++) {
                        if (isValidMove(state, { x, y }, { x: dx, y: dy })) {
                            moves.push({ from: { x, y }, to: { x: dx, y: dy } });
                        }
                    }
                }
            }
        }
    }
    return moves;
};

const minimax = (
    state: GameState,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    player: Player
): number => {
    if (state.isGameOver || depth === 0) {
        return evaluate(state, player);
    }

    const currentPlayer = isMaximizing ? player : (player === 'white' ? 'black' : 'white');
    const validMoves = getAllValidMoves(state, currentPlayer);

    if (validMoves.length === 0) {
        // ステイルメイトまたはチェックメイト
        // ここでは簡易的に評価値を返す（チェックメイトなら負け/勝ち）
        // engine.tsでisGameOverがtrueになっているはずだが、なっていない場合はステイルメイト
        return evaluate(state, player);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const newState = executeMove(state, move.from, move.to);
            const evalScore = minimax(newState, depth - 1, false, alpha, beta, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const newState = executeMove(state, move.from, move.to);
            const evalScore = minimax(newState, depth - 1, true, alpha, beta, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

const evaluate = (state: GameState, player: Player): number => {
    if (state.winner === player) return 10000;
    if (state.winner && state.winner !== 'draw') return -10000;
    if (state.winner === 'draw') return 0;

    let score = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const p = state.board[y][x];
            if (p) {
                const value = PIECE_VALUES[p.type];
                score += p.player === player ? value : -value;
            }
        }
    }
    return score;
};
