import { GameState, Move, Player, Coordinates, Piece, PieceType } from './types';
import { getLegalMoves, getValidDrops } from './rules';
import { executeMove, executeDrop } from './engine';

type AIMove = {
    type: 'move';
    from: Coordinates;
    to: Coordinates;
    promote: boolean;
} | {
    type: 'drop';
    pieceType: PieceType;
    to: Coordinates;
};

// Piece Square Tables (Simplified)
// Lower index = Top of board (gote home), Higher = Bottom (sente home)
// For Sente, we use as is. For Gote, we mirror logic.
// Values are small positional adjustments (approx +/- 10-20 points)
const PST: Record<PieceType, number[][]> = {
    pawn: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [-5, -5, -5, -5, -5, -5, -5, -5, -5],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // King safety preference (sit in castle)
    king: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [10, 20, 0, 0, 0, 0, 0, 20, 10],
        [20, 30, 10, 0, 0, 0, 10, 30, 20]
    ],
    rook: [], bishop: [], gold: [], silver: [], knight: [], lance: []
};

// Fill empty PSTs
['rook', 'bishop', 'gold', 'silver', 'knight', 'lance'].forEach(key => {
    if ((PST as any)[key].length === 0) {
        (PST as any)[key] = Array(9).fill(Array(9).fill(0));
    }
});

// Time limit for iterative deepening (ms)
const TIME_LIMIT = 2000;

export const getBestMove = (gameState: GameState, aiPlayer: Player, level: number = 2): AIMove | null => {
    if (level === 1) return getLevel1Move(gameState, aiPlayer);

    // Level 2+: Iterative Deepening with improved eval
    const startTime = performance.now();
    let bestMove: AIMove | null = null;
    let depth = 1;
    let maxDepth = level === 2 ? 3 : 5; // Go deeper for higher levels

    // If level 2, maybe fixed depth is enough, but ID is safer for time
    // For this implementation, let's do ID
    try {
        while (depth <= maxDepth) {
            if (performance.now() - startTime > TIME_LIMIT) break;

            const result = alphabetaRoot(gameState, depth, aiPlayer, startTime);
            if (result) {
                bestMove = result.move;
                if (result.score > 9000) break; // Winning move found
            }
            depth++;
        }
    } catch (e) {
        console.error("AI Error", e);
    }

    return bestMove;
};

const getLevel1Move = (gameState: GameState, aiPlayer: Player): AIMove | null => {
    const moves = getAllPossibleMoves(gameState, aiPlayer);
    if (moves.length === 0) return null;
    // Simple random
    return moves[Math.floor(Math.random() * moves.length)];
};

// Alpha-Beta Search
const alphabetaRoot = (gameState: GameState, depth: number, aiPlayer: Player, startTime: number): { move: AIMove, score: number } | null => {
    const moves = getAllPossibleMoves(gameState, aiPlayer);
    if (moves.length === 0) return null;

    // Move Ordering: Captures and Promotions first
    moves.sort((a, b) => scoreMove(b, gameState) - scoreMove(a, gameState));

    let bestMove = moves[0];
    let alpha = -Infinity;
    let beta = Infinity;
    let bestScore = -Infinity;

    for (const move of moves) {
        if (performance.now() - startTime > TIME_LIMIT) break;

        const newState = simulateMove(gameState, move, aiPlayer);
        const score = -alphabeta(newState, depth - 1, -beta, -alpha, aiPlayer === 'sente' ? 'gote' : 'sente', aiPlayer, startTime);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        alpha = Math.max(alpha, score);
    }

    return { move: bestMove, score: bestScore };
};

const alphabeta = (
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    currentPlayer: Player,
    rootPlayer: Player,
    startTime: number
): number => {
    if (performance.now() - startTime > TIME_LIMIT) return 0; // Timeout fallback

    if (depth === 0 || gameState.winner) {
        // Evaluate from perspective of currentPlayer
        const score = evaluateBoard(gameState, currentPlayer);
        return score;
    }

    const moves = getAllPossibleMoves(gameState, currentPlayer);
    if (moves.length === 0) {
        // No moves = checkmate/stalemate
        if (gameState.isCheck) return -10000 + (10 - depth); // Prefer faster checkmate
        return 0; // Stalemate?
    }

    // Move Ordering
    moves.sort((a, b) => scoreMove(b, gameState) - scoreMove(a, gameState));

    for (const move of moves) {
        const newState = simulateMove(gameState, move, currentPlayer);
        // Negamax: score is -alphabeta(...)
        const score = -alphabeta(newState, depth - 1, -beta, -alpha, currentPlayer === 'sente' ? 'gote' : 'sente', rootPlayer, startTime);

        if (score >= beta) return beta;
        alpha = Math.max(alpha, score);
    }

    return alpha;
};

// Simple heuristic for move ordering
const scoreMove = (move: AIMove, state: GameState): number => {
    let score = 0;
    if (move.type === 'move') {
        if (move.promote) score += 50;
        const target = state.board[move.to.y][move.to.x];
        if (target) score += getPieceValue(target.type) * 10;
    }
    return score;
};

// Evaluation Function
const evaluateBoard = (gameState: GameState, player: Player): number => {
    // If winner, massive score
    if (gameState.winner === player) return 10000;
    if (gameState.winner && gameState.winner !== player) return -10000;

    let score = 0;
    const opponent = player === 'sente' ? 'gote' : 'sente';

    // 1. Material
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                let val = getPieceValue(cell.type);
                if (cell.isPromoted) val *= 1.4; // Promoted value

                // PST
                let posVal = 0;
                if (['pawn', 'king'].includes(cell.type)) {
                    // Use PST
                    // Sente: y is index
                    // Gote: y is 8-index
                    const pstY = cell.owner === 'sente' ? y : 8 - y;
                    const pstX = cell.owner === 'sente' ? x : 8 - x;
                    posVal = (PST as any)[cell.type][pstY]?.[pstX] || 0;
                }

                if (cell.owner === player) {
                    score += val + posVal;
                } else {
                    score -= (val + posVal);
                }
            }
        });
    });

    // 2. Hands
    gameState.hands[player].forEach(p => score += getPieceValue(p.type) * 1.1);
    gameState.hands[opponent].forEach(p => score -= getPieceValue(p.type) * 1.1);

    // 3. Mobility (Simple count of legal moves)
    // Calculating full mobility is expensive, let's approximate or skip for performance in JS
    // Or just add a small random factor to break symmetry
    score += Math.random() * 2;

    return score;
};

const getPieceValue = (type: PieceType): number => {
    switch (type) {
        case 'king': return 1000;
        case 'rook': return 110;
        case 'bishop': return 100;
        case 'gold': return 60;
        case 'silver': return 50;
        case 'knight': return 40;
        case 'lance': return 30;
        case 'pawn': return 10;
        default: return 0;
    }
};

const getAllPossibleMoves = (gameState: GameState, player: Player): AIMove[] => {
    const moves: AIMove[] = [];

    // Board moves
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && cell.owner === player) {
                const legalMoves = getLegalMoves(gameState.board, cell, { x, y });
                legalMoves.forEach(to => {
                    const canPromote = (player === 'sente' && (y <= 2 || to.y <= 2)) ||
                        (player === 'gote' && (y >= 6 || to.y >= 6));

                    if (canPromote && !cell.isPromoted && !['gold', 'king'].includes(cell.type)) {
                        moves.push({ type: 'move', from: { x, y }, to, promote: true });
                        // Optional: Don't promote if it's bad?
                        // For simplicity, consider both unless mandatory.
                        // Actually, AI should consider both.
                        if (cell.type !== 'pawn' && cell.type !== 'lance') { // Pawn/Lance often must promote if deep
                            moves.push({ type: 'move', from: { x, y }, to, promote: false });
                        }
                    } else {
                        moves.push({ type: 'move', from: { x, y }, to, promote: false });
                    }
                });
            }
        });
    });

    // Drop moves
    const uniqueTypes = Array.from(new Set(gameState.hands[player].map(p => p.type)));
    for (const type of uniqueTypes) {
        const piece = gameState.hands[player].find(p => p.type === type);
        if (piece) {
            const drops = getValidDrops(gameState.board, piece, player, gameState.hands);
            drops.forEach(to => {
                moves.push({ type: 'drop', pieceType: type, to });
            });
        }
    }

    return moves;
};

const simulateMove = (gameState: GameState, move: AIMove, player: Player): GameState => {
    if (move.type === 'move') {
        return executeMove(gameState, move.from, move.to, move.promote);
    } else {
        return executeDrop(gameState, move.pieceType, move.to, player);
    }
};
