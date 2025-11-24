import { GameState, Player, FIRST_STORE, SECOND_STORE, PITS_PER_PLAYER } from './types';
import { executeMove, isValidMove } from './engine';

const MAX_DEPTH = 4; // 探索深さ

export const getBestMove = (state: GameState, player: Player): number | null => {
    const validMoves = getValidMoves(state);
    if (validMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const move of validMoves) {
        const newState = executeMove(state, move);
        // 連続手番の場合は深さを減らさずに探索（あるいはボーナスを与える）
        // ここでは簡易的に深さを減らす（連続手番も1手とみなす）が、連続手番ならもう一度自分のターンで探索すべき
        // ミニマックスの再帰で処理する

        const score = minimax(newState, MAX_DEPTH - 1, false, -Infinity, Infinity, player);
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

    // ターンが変わっていない場合（連続手番）は、Maximize/Minimizeを維持
    const isSameTurn = state.turn === (isMaximizing ? player : (player === 'first' ? 'second' : 'first'));
    // しかし、executeMoveでターンは切り替わっているはず。
    // もし連続手番なら state.turn は player のまま。
    // つまり isMaximizing のときに state.turn === player なら、次も Maximizing

    // ロジック整理:
    // 現在のノードの評価値を求める。
    // 次の手番が自分なら Maximize, 相手なら Minimize

    const nextIsMaximizing = state.turn === player;

    const validMoves = getValidMoves(state);

    if (nextIsMaximizing) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const newState = executeMove(state, move);
            const evalScore = minimax(newState, depth - 1, true, alpha, beta, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const newState = executeMove(state, move);
            const evalScore = minimax(newState, depth - 1, false, alpha, beta, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

const evaluate = (state: GameState, player: Player): number => {
    const myStore = player === 'first' ? state.board[FIRST_STORE] : state.board[SECOND_STORE];
    const oppStore = player === 'first' ? state.board[SECOND_STORE] : state.board[FIRST_STORE];

    let score = (myStore - oppStore) * 100;

    // 自分の側の種の数（多い方が有利になりやすいが、終了条件にも関わるので微妙）
    // ここではストアの差を最優先

    return score;
};
