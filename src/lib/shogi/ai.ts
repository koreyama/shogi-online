import { GameState, Move, Player, Coordinates, Piece, PieceType } from './types';
import { getLegalMoves, getValidDrops } from './rules';
import { executeMove, executeDrop } from './engine';

type AIMove = {
    type: 'move';
    from: Coordinates;
    to: Coordinates;
    promote: boolean;
    score?: number;
} | {
    type: 'drop';
    pieceType: PieceType;
    to: Coordinates;
    score?: number;
};

// --- Evaluation Constants ---
const PIECE_VALUES: Record<PieceType, number> = {
    king: 15000,
    rook: 1200, // Important
    bishop: 900,
    gold: 600,
    silver: 500,
    knight: 400,
    lance: 350,
    pawn: 100
};

// Promoted values (approximate)
const PROMOTED_VALUES: Record<PieceType, number> = {
    rook: 1500, // Dragon
    bishop: 1200, // Horse
    silver: 600, // Narigin (like Gold)
    knight: 600, // Narikei
    lance: 600, // Narikyo
    pawn: 600,  // Tokin
    king: 15000,
    gold: 600
};

// Piece Square Tables (Simplified Positioning)
// Sente Perspective (y=0 top, y=8 bottom). 
// Sente starts at bottom (y=6,7,8).
// Higher values = good for Sente.
// We will mirror for Gote.
const PST: Record<PieceType, number[][]> = {
    pawn: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [50, 50, 50, 50, 50, 50, 50, 50, 50], // Promotion zone approach
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [0, 0, 0, 0, 20, 0, 0, 0, 0],     // Center control
        [0, 0, 0, 0, 10, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    silver: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [10, 10, 10, 10, 10, 10, 10, 10, 10], // Advancing
        [0, 0, 0, 0, 20, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    gold: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0], // Defense
        [0, 0, 5, 10, 10, 10, 5, 0, 0], // Castle area
        [0, 0, 10, 20, 15, 20, 10, 0, 0]
    ],
    king: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [10, 20, 30, 0, 0, 0, 30, 20, 10], // Castle preference (away from center)
        [20, 40, 50, 10, 0, 10, 50, 40, 20]
    ],
    rook: [], bishop: [], knight: [], lance: []
};

// Fill empty PSTs with 0
['rook', 'bishop', 'knight', 'lance'].forEach(key => {
    if ((PST as any)[key].length === 0) {
        (PST as any)[key] = Array(9).fill(Array(9).fill(0));
    }
});

const TIME_LIMIT = 1500; // Reduced to 1.5s for better responsiveness
let SEARCH_NODES = 0;

export const getBestMove = (gameState: GameState, aiPlayer: Player, level: number = 2): AIMove | null => {
    const startTime = performance.now();
    SEARCH_NODES = 0;

    let maxDepth = 1;
    let useQuiescence = false;

    // AI Configuration
    switch (level) {
        case 1:
            // Level 1: Beginner. Depth 1 search. 
            // Avoids blatant mistakes but plays simply.
            maxDepth = 2; // Increased to 2 for basic lookahead
            useQuiescence = false;
            break;
        case 2:
            // Level 2: Intermediate. Depth 3 + Quiescence.
            maxDepth = 3;
            useQuiescence = true;
            break;
        case 3:
            // Level 3: Advanced. Depth 4 (or 5 if fast) + Quiescence + King Safety.
            maxDepth = 4;
            useQuiescence = true;
            break;
        default:
            maxDepth = 3;
    }

    let bestMove: AIMove | null = null;

    // Iterative Deepening
    // Prevents finding a deep mate but timing out before returning it.
    // Also helps move ordering.
    try {
        for (let d = 1; d <= maxDepth; d++) {
            if (performance.now() - startTime > TIME_LIMIT) break;

            const result = alphabetaRoot(gameState, d, aiPlayer, startTime, useQuiescence);
            if (result.move) {
                bestMove = result.move;
                // console.log(`Level ${level} Depth ${d}: Score ${result.score} nodes ${SEARCH_NODES}`);
                if (result.score > 10000) break; // Found mate
            }
        }
    } catch (e) {
        console.error("AI Error", e);
    }

    // Fallback if no move found (shouldn't happen unless 0 moves available)
    if (!bestMove) {
        const moves = getAllPossibleMoves(gameState, aiPlayer);
        if (moves.length > 0) return moves[0];
    }

    return bestMove;
};

// Root Search
const alphabetaRoot = (gameState: GameState, depth: number, aiPlayer: Player, startTime: number, useQuiescence: boolean): { move: AIMove | null, score: number } => {
    const moves = getAllPossibleMoves(gameState, aiPlayer);
    if (moves.length === 0) return { move: null, score: -Infinity };

    // Move Ordering
    moves.sort((a, b) => scoreMove(b, gameState) - scoreMove(a, gameState));

    let bestMove: AIMove | null = moves[0];
    let alpha = -Infinity;
    let beta = Infinity;
    let bestScore = -Infinity;

    for (const move of moves) {
        if (performance.now() - startTime > TIME_LIMIT) break;

        const newState = simulateMove(gameState, move, aiPlayer);
        // Pass -beta, -alpha for Negamax
        const score = -alphabeta(newState, depth - 1, -beta, -alpha, aiPlayer === 'sente' ? 'gote' : 'sente', aiPlayer, startTime, useQuiescence);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) {
            alpha = score;
        }
        // Root doesn't prune typically unless we want aspiration windows
    }

    return { move: bestMove, score: bestScore };
};

// Recursive Negamax
const alphabeta = (
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    currentPlayer: Player,
    rootPlayer: Player,
    startTime: number,
    useQuiescence: boolean
): number => {
    SEARCH_NODES++;
    if ((SEARCH_NODES & 1023) === 0) {
        if (performance.now() - startTime > TIME_LIMIT) return 0;
    }

    if (gameState.winner) {
        return gameState.winner === currentPlayer ? 20000 : -20000;
    }

    if (depth <= 0) {
        if (useQuiescence) {
            return quiescenceSearch(gameState, alpha, beta, currentPlayer, 0); // Start qDepth 0
        } else {
            return evaluateBoard(gameState, currentPlayer);
        }
    }

    const moves = getAllPossibleMoves(gameState, currentPlayer);
    if (moves.length === 0) {
        // No moves. Check conditions.
        // In Shogi, if you can't move, you lose? (Depending on rules, usually checkmate)
        return -20000 + depth; // Prefer delaying loss
    }

    // Move Ordering
    moves.sort((a, b) => scoreMove(b, gameState) - scoreMove(a, gameState));

    let localMax = -Infinity;
    for (const move of moves) {
        const newState = simulateMove(gameState, move, currentPlayer);
        const score = -alphabeta(newState, depth - 1, -beta, -alpha, currentPlayer === 'sente' ? 'gote' : 'sente', rootPlayer, startTime, useQuiescence);

        if (score > localMax) localMax = score;
        if (localMax > alpha) alpha = localMax;

        if (alpha >= beta) {
            break; // Prune
        }
    }

    return localMax;
};

// Quiescence Search: Only search captures/promotions to avoid horizon effect
const quiescenceSearch = (gameState: GameState, alpha: number, beta: number, currentPlayer: Player, qDepth: number = 0): number => {
    SEARCH_NODES++;

    // Safety break to prevent explosion
    if (qDepth > 2) return evaluateBoard(gameState, currentPlayer);

    // Stand-pat score (evaluate current position before moving)
    const standPat = evaluateBoard(gameState, currentPlayer);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    // Generate only noisy moves (captures, promotions)
    const moves = getAllPossibleMoves(gameState, currentPlayer).filter(m => isNoisy(m, gameState));

    // Order by MVV/LVA (Most Valuable Victim, Least Valuable Aggressor) - simplified here
    moves.sort((a, b) => scoreMove(b, gameState) - scoreMove(a, gameState));

    for (const move of moves) {
        const newState = simulateMove(gameState, move, currentPlayer);
        // Recurse with qDepth + 1
        const score = -quiescenceSearch(newState, -beta, -alpha, currentPlayer === 'sente' ? 'gote' : 'sente', qDepth + 1);

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }

    return alpha;
};

const isNoisy = (move: AIMove, state: GameState): boolean => {
    if (move.type === 'drop') return false; // Drops are generally not "noisy" captures, though they can check.

    // Capture?
    const targetCell = state.board[move.to.y][move.to.x];
    if (targetCell) return true;

    // Promote?
    if (move.promote) return true;

    return false;
};


// Evaluation Function
const evaluateBoard = (gameState: GameState, player: Player): number => {
    let score = 0;
    const opponent = player === 'sente' ? 'gote' : 'sente';

    // 1. Material & Position
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                let val = cell.isPromoted ? PROMOTED_VALUES[cell.type] : PIECE_VALUES[cell.type];

                // PST
                const pstY = cell.owner === 'sente' ? y : 8 - y;
                const pstX = cell.owner === 'sente' ? x : 8 - x;
                const pstVal = (PST as any)[cell.type][pstY]?.[pstX] || 0;

                if (cell.owner === player) {
                    score += val + pstVal;
                } else {
                    score -= (val + pstVal);
                }
            }
        });
    });

    // 2. Hand Material (Very important in Shogi)
    gameState.hands[player].forEach(p => score += (PIECE_VALUES[p.type] * 1.05)); // Slight bonus for having in hand (flexibility)
    gameState.hands[opponent].forEach(p => score -= (PIECE_VALUES[p.type] * 1.05));

    // 3. King Safety (Simple neighbors check)
    score += evaluateKingSafety(gameState, player);
    score -= evaluateKingSafety(gameState, opponent);

    // 4. Random noise to vary play slightly
    score += (Math.random() - 0.5) * 10;

    return score;
};

const evaluateKingSafety = (gameState: GameState, player: Player): number => {
    // Find King
    let kingPos: Coordinates | null = null;
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = gameState.board[y][x];
            if (cell && cell.type === 'king' && cell.owner === player) {
                kingPos = { x, y };
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return -5000; // King dead?

    let safety = 0;
    // Check surrounding squares for generals (Gold, Silver)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = kingPos.x + dx;
            const ny = kingPos.y + dy;
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                const neighbor = gameState.board[ny][nx];
                if (neighbor && neighbor.owner === player) {
                    if (neighbor.type === 'gold') safety += 150;
                    if (neighbor.type === 'silver') safety += 100;
                    if (neighbor.type === 'pawn') safety += 30; // Wall
                }
            }
        }
    }
    return safety;
};


// Move Ordering Heuristic
const scoreMove = (move: AIMove, state: GameState): number => {
    let score = 0;

    if (move.type === 'move') {
        const piece = state.board[move.from.y][move.from.x];
        const target = state.board[move.to.y][move.to.x];

        // MVV/LVA (Most Valuable Victim, Least Valuable Aggressor)
        if (target) {
            score += 10 * (PIECE_VALUES[target.type] || 0) - (PIECE_VALUES[piece?.type || 'pawn'] || 0);
        }

        // Promotion bonus
        if (move.promote) score += 300;
    } else {
        // Drop moves: central drops preferred usually? Or attacking?
        // Prioritize drops that check? (Expensive to calc here)
        score += 50;
    }

    return score;
};


// -- Helpers / Engine Imports Wrapper --
// Re-implementing logic here because we don't want to rely on slow external helpers inside the tight loop if possible,
// but for now we reuse existing robust helpers.

const getAllPossibleMoves = (gameState: GameState, player: Player): AIMove[] => {
    const moves: AIMove[] = [];

    // Board moves
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && cell.owner === player) {
                const legalMoves = getLegalMoves(gameState.board, cell, { x, y });
                legalMoves.forEach(to => {
                    const isZone = (player === 'sente' && (y <= 2 || to.y <= 2)) ||
                        (player === 'gote' && (y >= 6 || to.y >= 6));

                    if (isZone && !cell.isPromoted && !['gold', 'king'].includes(cell.type)) {
                        // Promote
                        moves.push({ type: 'move', from: { x, y }, to, promote: true });
                        // Don't promote
                        if (cell.type !== 'pawn' && cell.type !== 'lance') {
                            moves.push({ type: 'move', from: { x, y }, to, promote: false });
                        }
                    } else {
                        moves.push({ type: 'move', from: { x, y }, to, promote: false });
                    }
                });
            }
        });
    });

    // Drops
    const uniqueTypes = Array.from(new Set(gameState.hands[player].map(p => p.type)));
    for (const type of uniqueTypes) {
        const piece = gameState.hands[player].find(p => p.type === type);
        if (piece) {
            const drops = getValidDrops(gameState.board, piece, player, gameState.hands);
            drops.forEach(to => moves.push({ type: 'drop', pieceType: type, to }));
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
