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
    rook: 1000,
    bishop: 800,
    gold: 600,
    silver: 500,
    knight: 400,
    lance: 350,
    pawn: 100
};

// Promoted values
const PROMOTED_VALUES: Record<PieceType, number> = {
    rook: 1300,
    bishop: 1100,
    silver: 600,
    knight: 600,
    lance: 600,
    pawn: 600,
    king: 15000,
    gold: 600
};

// Piece Square Tables (Simplified Positioning)
// Sente Perspective (y=0 top, y=8 bottom). Sente starts at bottom.
const PST: Record<PieceType, number[][]> = {
    pawn: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0], // y=0: promote
        [100, 100, 100, 100, 100, 100, 100, 100, 100], // y=1: nearing promote (if unpromoted, forced tokin soon)
        [50, 50, 50, 50, 50, 50, 50, 50, 50],     // y=2: promotion zone edge
        [30, 30, 30, 30, 40, 30, 30, 30, 30],     // y=3
        [10, 10, 10, 10, 20, 10, 10, 10, 10],     // y=4: center
        [0, 0, 0, 0, 0, 0, 0, 0, 0],              // y=5
        [-20, -20, -20, -20, -20, -20, -20, -20, -20], // y=6 (starting pos for sente pawns)
        [0, 0, 0, 0, 0, 0, 0, 0, 0],              // y=7
        [0, 0, 0, 0, 0, 0, 0, 0, 0]               // y=8
    ],
    silver: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [30, 30, 30, 30, 40, 30, 30, 30, 30],
        [30, 30, 30, 30, 40, 30, 30, 30, 30],
        [20, 20, 20, 20, 30, 20, 20, 20, 20],
        [10, 10, 10, 10, 15, 10, 10, 10, 10],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    gold: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [10, 10, 10, 10, 15, 10, 10, 10, 10],
        [20, 20, 20, 20, 30, 20, 20, 20, 20],
        [10, 10, 10, 10, 20, 10, 10, 10, 10],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 10, 15, 15, 15, 10, 0, 0],
        [0, 0, 15, 20, 20, 20, 15, 0, 0]
    ],
    king: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [20, 40, 40, 10, 0, 10, 40, 40, 20],
        [30, 50, 60, 20, 0, 20, 60, 50, 30]
    ],
    knight: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [30, 30, 30, 30, 30, 30, 30, 30, 30],
        [15, 15, 20, 30, 30, 30, 20, 15, 15],
        [10, 10, 15, 15, 20, 15, 15, 10, 10],
        [0, 0, 5, 5, 5, 5, 5, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    lance: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [50, 50, 50, 50, 50, 50, 50, 50, 50],
        [30, 30, 30, 30, 30, 30, 30, 30, 30],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [10, 10, 10, 10, 15, 10, 10, 10, 10],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    rook: [
        [30, 30, 30, 30, 30, 30, 30, 30, 30],
        [30, 30, 30, 30, 30, 30, 30, 30, 30],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [10, 10, 10, 10, 15, 10, 10, 10, 10],
        [10, 10, 10, 10, 15, 10, 10, 10, 10],
        [0, 0, 0, 0, 10, 0, 0, 0, 0],
        [0, 0, 0, 0, 10, 0, 0, 0, 0],
        [0, 0, 0, 0, 10, 0, 0, 0, 0],
        [0, 0, 0, 0, 5, 0, 0, 0, 0]
    ],
    bishop: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 10, 0, 0, 0, 0],
        [0, 0, 10, 10, 10, 10, 10, 0, 0],
        [0, 10, 20, 20, 20, 20, 20, 10, 0],
        [10, 20, 30, 30, 30, 30, 30, 20, 10],
        [0, 10, 20, 20, 20, 20, 20, 10, 0],
        [0, 0, 10, 10, 10, 10, 10, 0, 0],
        [0, 0, 0, 0, 5, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
};

const TIME_LIMIT = 2000; // Increased to 2.0s for better depth
let SEARCH_NODES = 0;
let KILLER_MOVES: AIMove[][] = [];

class TimeoutError extends Error { }

export const getBestMove = (gameState: GameState, aiPlayer: Player, level: number = 2): AIMove | null => {
    const startTime = performance.now();
    SEARCH_NODES = 0;
    KILLER_MOVES = Array(20).fill([]).map(() => []);

    let maxDepth = 1;
    let useQuiescence = false;

    // AI Configuration
    switch (level) {
        case 1:
            maxDepth = 2;
            useQuiescence = false;
            break;
        case 2:
            maxDepth = 3;
            useQuiescence = true;
            break;
        case 3:
            maxDepth = 4;
            useQuiescence = true;
            break;
        default:
            maxDepth = 3;
    }

    let bestMove: AIMove | null = null;

    try {
        for (let d = 1; d <= maxDepth; d++) {
            if (performance.now() - startTime >= TIME_LIMIT) break;

            const result = alphabetaRoot(gameState, d, aiPlayer, startTime, useQuiescence);
            if (result.move) {
                bestMove = result.move;
                if (result.score > 10000) break; // Found mate
            }
        }
    } catch (e) {
        if (e instanceof TimeoutError) {
            // Evaluated what we could within limits
        } else {
            console.error("AI Error", e);
        }
    }

    // Fallback
    if (!bestMove) {
        const moves = getAllPossibleMoves(gameState, aiPlayer);
        if (moves.length > 0) return moves[Math.floor(Math.random() * moves.length)];
    }

    return bestMove;
};

// Root Search
const alphabetaRoot = (gameState: GameState, depth: number, aiPlayer: Player, startTime: number, useQuiescence: boolean): { move: AIMove | null, score: number } => {
    const moves = getAllPossibleMoves(gameState, aiPlayer);
    if (moves.length === 0) return { move: null, score: -Infinity };

    // Move Ordering
    moves.sort((a, b) => scoreMove(b, gameState, 0) - scoreMove(a, gameState, 0));

    let bestMove: AIMove | null = moves[0];
    let alpha = -Infinity;
    let beta = Infinity;
    let bestScore = -Infinity;

    for (const move of moves) {
        if (performance.now() - startTime >= TIME_LIMIT) throw new TimeoutError();

        const newState = simulateMove(gameState, move, aiPlayer);
        const score = -alphabeta(newState, depth - 1, -beta, -alpha, aiPlayer === 'sente' ? 'gote' : 'sente', aiPlayer, startTime, useQuiescence, 1);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) {
            alpha = score;
        }
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
    useQuiescence: boolean,
    ply: number
): number => {
    SEARCH_NODES++;
    if ((SEARCH_NODES & 1023) === 0) {
        if (performance.now() - startTime >= TIME_LIMIT) throw new TimeoutError();
    }

    if (gameState.winner) {
        return gameState.winner === currentPlayer ? 20000 - ply : -20000 + ply;
    }

    if (depth <= 0) {
        if (useQuiescence) {
            return quiescenceSearch(gameState, alpha, beta, currentPlayer, ply, 0);
        } else {
            return evaluateBoard(gameState, currentPlayer);
        }
    }

    const moves = getAllPossibleMoves(gameState, currentPlayer);
    if (moves.length === 0) {
        return -20000 + ply;
    }

    moves.sort((a, b) => scoreMove(b, gameState, ply) - scoreMove(a, gameState, ply));

    let localMax = -Infinity;
    for (const move of moves) {
        const newState = simulateMove(gameState, move, currentPlayer);
        const score = -alphabeta(newState, depth - 1, -beta, -alpha, currentPlayer === 'sente' ? 'gote' : 'sente', rootPlayer, startTime, useQuiescence, ply + 1);

        if (score > localMax) localMax = score;
        if (localMax > alpha) alpha = localMax;

        if (alpha >= beta) {
            // Store Killer Move
            if (ply < KILLER_MOVES.length) {
                KILLER_MOVES[ply].unshift(move);
                if (KILLER_MOVES[ply].length > 2) KILLER_MOVES[ply].pop(); // Keep top 2
            }
            break; // Prune
        }
    }

    return localMax;
};

// Quiescence Search
const quiescenceSearch = (gameState: GameState, alpha: number, beta: number, currentPlayer: Player, ply: number, qDepth: number = 0): number => {
    SEARCH_NODES++;

    if (qDepth > 2) return evaluateBoard(gameState, currentPlayer);

    const standPat = evaluateBoard(gameState, currentPlayer);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const moves = getAllPossibleMoves(gameState, currentPlayer).filter(m => isNoisy(m, gameState));

    moves.sort((a, b) => scoreMove(b, gameState, ply) - scoreMove(a, gameState, ply));

    for (const move of moves) {
        const newState = simulateMove(gameState, move, currentPlayer);
        const score = -quiescenceSearch(newState, -beta, -alpha, currentPlayer === 'sente' ? 'gote' : 'sente', ply + 1, qDepth + 1);

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }

    return alpha;
};

const isNoisy = (move: AIMove, state: GameState): boolean => {
    if (move.type === 'drop') return false;
    const targetCell = state.board[move.to.y][move.to.x];
    if (targetCell) return true;
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

    // 2. Hand Material
    gameState.hands[player].forEach(p => score += (PIECE_VALUES[p.type] * 1.05));
    gameState.hands[opponent].forEach(p => score -= (PIECE_VALUES[p.type] * 1.05));

    // 3. King Safety
    score += evaluateKingSafety(gameState, player);
    score -= evaluateKingSafety(gameState, opponent);

    // 4. Random noise slightly to prevent perfect repetition in equivalent states
    score += (Math.random() - 0.5) * 5;

    return score;
};

const evaluateKingSafety = (gameState: GameState, player: Player): number => {
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

    if (!kingPos) return -5000;

    let safety = 0;
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
                    if (neighbor.type === 'pawn') safety += 30;
                }
            }
        }
    }
    return safety;
};

const isSameMove = (a: AIMove, b: AIMove) => {
    if (a.type !== b.type) return false;
    if (a.type === 'move' && b.type === 'move') {
        return a.from.x === b.from.x && a.from.y === b.from.y && a.to.x === b.to.x && a.to.y === b.to.y && a.promote === b.promote;
    }
    if (a.type === 'drop' && b.type === 'drop') {
        return a.pieceType === b.pieceType && a.to.x === b.to.x && a.to.y === b.to.y;
    }
    return false;
}

// Move Ordering Heuristic
const scoreMove = (move: AIMove, state: GameState, ply: number): number => {
    let score = 0;

    if (move.type === 'move') {
        const piece = state.board[move.from.y][move.from.x];
        const target = state.board[move.to.y][move.to.x];

        // MVV/LVA
        if (target) {
            score += 10000 + 10 * (PIECE_VALUES[target.type] || 0) - (PIECE_VALUES[piece?.type || 'pawn'] || 0);
        }

        if (move.promote) score += 300;

        // Killer move bonus
        if (ply < KILLER_MOVES.length) {
            const plyKillers = KILLER_MOVES[ply];
            if (plyKillers.length > 0 && isSameMove(move, plyKillers[0])) score += 5000;
            else if (plyKillers.length > 1 && isSameMove(move, plyKillers[1])) score += 4000;
        }

    } else {
        score += 50;
    }

    return score;
};

// -- Helpers --
const getAllPossibleMoves = (gameState: GameState, player: Player): AIMove[] => {
    const moves: AIMove[] = [];

    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && cell.owner === player) {
                const legalMoves = getLegalMoves(gameState.board, cell, { x, y });
                legalMoves.forEach(to => {
                    const isZone = (player === 'sente' && (y <= 2 || to.y <= 2)) ||
                        (player === 'gote' && (y >= 6 || to.y >= 6));

                    if (isZone && !cell.isPromoted && !['gold', 'king'].includes(cell.type)) {
                        moves.push({ type: 'move', from: { x, y }, to, promote: true });
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
