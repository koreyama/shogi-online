import { GameState, Player, Board, ROWS, COLS } from './types';
import { getValidMoves, dropPiece } from './engine';

const MAX_DEPTH = 5;

export function getBestMove(gameState: GameState, player: Player): number {
    const validMoves = getValidMoves(gameState.board);
    if (validMoves.length === 0) return -1;

    // If only one move, take it
    if (validMoves.length === 1) return validMoves[0];

    // Check for immediate win
    for (const col of validMoves) {
        const nextState = dropPiece(gameState, col);
        if (nextState.winner === player) return col;
    }

    // Check for immediate loss (block opponent)
    const opponent = player === 'red' ? 'yellow' : 'red';
    for (const col of validMoves) {
        // Simulate opponent move on current board
        // We need to simulate "if I don't play here, can opponent play here and win?"
        // Actually, we can just check if opponent can win in their next turn
        // But simpler: simulate opponent playing in this column
        const tempState = { ...gameState, turn: opponent as Player };
        const nextState = dropPiece(tempState, col);
        if (nextState.winner === opponent) return col;
    }

    let bestScore = -Infinity;
    let bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];

    for (const col of validMoves) {
        const nextState = dropPiece(gameState, col);
        const score = minimax(nextState, MAX_DEPTH - 1, -Infinity, Infinity, false, player);
        if (score > bestScore) {
            bestScore = score;
            bestMove = col;
        }
    }

    return bestMove;
}

function minimax(state: GameState, depth: number, alpha: number, beta: number, isMaximizing: boolean, player: Player): number {
    if (state.winner === player) return 10000 + depth;
    if (state.winner && state.winner !== 'draw') return -10000 - depth;
    if (state.winner === 'draw') return 0;
    if (depth === 0) return evaluateBoard(state.board, player);

    const validMoves = getValidMoves(state.board);
    if (validMoves.length === 0) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const col of validMoves) {
            const nextState = dropPiece(state, col);
            const evalScore = minimax(nextState, depth - 1, alpha, beta, false, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const col of validMoves) {
            const nextState = dropPiece(state, col);
            const evalScore = minimax(nextState, depth - 1, alpha, beta, true, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(board: Board, player: Player): number {
    let score = 0;
    const opponent = player === 'red' ? 'yellow' : 'red';

    // Center column preference
    const centerArray = [];
    for (let r = 0; r < ROWS; r++) {
        if (board[r][3] === player) score += 3;
    }

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
            score += evaluateWindow(window, player, opponent);
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
            score += evaluateWindow(window, player, opponent);
        }
    }

    // Diagonal /
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
            score += evaluateWindow(window, player, opponent);
        }
    }

    // Diagonal \
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
            score += evaluateWindow(window, player, opponent);
        }
    }

    return score;
}

function evaluateWindow(window: (Player | null)[], player: Player, opponent: Player): number {
    let score = 0;
    const playerCount = window.filter(cell => cell === player).length;
    const emptyCount = window.filter(cell => cell === null).length;
    const opponentCount = window.filter(cell => cell === opponent).length;

    if (playerCount === 4) {
        score += 100;
    } else if (playerCount === 3 && emptyCount === 1) {
        score += 5;
    } else if (playerCount === 2 && emptyCount === 2) {
        score += 2;
    }

    if (opponentCount === 3 && emptyCount === 1) {
        score -= 4;
    }

    return score;
}
