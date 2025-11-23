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

export const getBestMove = (gameState: GameState, aiPlayer: Player, level: number = 1): AIMove | null => {
    // Lv.1: ランダム + 駒得 (既存ロジック)
    if (level === 1) {
        return getLevel1Move(gameState, aiPlayer);
    }

    // Lv.2: 1手読み (自分の手の評価)
    if (level === 2) {
        return getLevel2Move(gameState, aiPlayer);
    }

    // Lv.3: 2手読み (Alpha-Beta探索)
    if (level === 3) {
        return getLevel3Move(gameState, aiPlayer);
    }

    return getLevel1Move(gameState, aiPlayer);
};

// Lv.1: ランダム + 駒得
const getLevel1Move = (gameState: GameState, aiPlayer: Player): AIMove | null => {
    const possibleMoves = getAllPossibleMoves(gameState, aiPlayer);
    if (possibleMoves.length === 0) return null;

    const scoredMoves = possibleMoves.map(move => {
        let score = Math.random() * 10; // ランダム要素

        if (move.type === 'move') {
            const targetCell = gameState.board[move.to.y][move.to.x];
            if (targetCell) {
                score += getPieceValue(targetCell.type) * 10;
            }
            if (move.promote) score += 20;
        }
        return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
};

// Lv.2: 1手読み
const getLevel2Move = (gameState: GameState, aiPlayer: Player): AIMove | null => {
    const possibleMoves = getAllPossibleMoves(gameState, aiPlayer);
    if (possibleMoves.length === 0) return null;

    let bestMove: AIMove | null = null;
    let bestScore = -Infinity;

    for (const move of possibleMoves) {
        const newState = simulateMove(gameState, move, aiPlayer);
        const score = evaluateBoard(newState, aiPlayer);

        // 少しランダム性を入れて、同じスコアならバラけるように
        const randomBonus = Math.random() * 5;

        if (score + randomBonus > bestScore) {
            bestScore = score + randomBonus;
            bestMove = move;
        }
    }

    return bestMove;
};

// Lv.3: Alpha-Beta探索 (2手読み)
const getLevel3Move = (gameState: GameState, aiPlayer: Player): AIMove | null => {
    const possibleMoves = getAllPossibleMoves(gameState, aiPlayer);
    if (possibleMoves.length === 0) return null;

    let bestMove: AIMove | null = null;
    let bestScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // 深さ2で探索 (自分 -> 相手)
    for (const move of possibleMoves) {
        const newState = simulateMove(gameState, move, aiPlayer);
        // 相手のターンになるので、相手にとっての最小スコア（自分にとっての最悪ケース）を探す
        const score = minimax(newState, 1, alpha, beta, false, aiPlayer);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};

const minimax = (
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: Player
): number => {
    if (depth === 0 || gameState.winner) {
        return evaluateBoard(gameState, aiPlayer);
    }

    const currentPlayer = isMaximizing ? aiPlayer : (aiPlayer === 'sente' ? 'gote' : 'sente');
    const possibleMoves = getAllPossibleMoves(gameState, currentPlayer);

    if (possibleMoves.length === 0) {
        return evaluateBoard(gameState, aiPlayer);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const newState = simulateMove(gameState, move, currentPlayer);
            const evalScore = minimax(newState, depth - 1, alpha, beta, false, aiPlayer);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const newState = simulateMove(gameState, move, currentPlayer);
            const evalScore = minimax(newState, depth - 1, alpha, beta, true, aiPlayer);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

// ヘルパー関数: 全ての手を生成
const getAllPossibleMoves = (gameState: GameState, player: Player): AIMove[] => {
    const moves: AIMove[] = [];

    // 盤上の移動
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && cell.owner === player) {
                const legalMoves = getLegalMoves(gameState.board, cell, { x, y });
                legalMoves.forEach(to => {
                    const canPromote = (player === 'sente' && (y <= 2 || to.y <= 2)) ||
                        (player === 'gote' && (y >= 6 || to.y >= 6));

                    if (canPromote && !cell.isPromoted && !['gold', 'king'].includes(cell.type)) {
                        moves.push({ type: 'move', from: { x, y }, to, promote: true });
                    }
                    moves.push({ type: 'move', from: { x, y }, to, promote: false });
                });
            }
        });
    });

    // 持ち駒打ち
    const uniqueHandPieces = Array.from(new Set(gameState.hands[player].map(p => p.type)))
        .map(type => gameState.hands[player].find(p => p.type === type)!);

    uniqueHandPieces.forEach(piece => {
        const drops = getValidDrops(gameState.board, piece, player, gameState.hands);
        drops.forEach(to => {
            moves.push({ type: 'drop', pieceType: piece.type, to });
        });
    });

    return moves;
};

// ヘルパー関数: 手のシミュレーション
const simulateMove = (gameState: GameState, move: AIMove, player: Player): GameState => {
    if (move.type === 'move') {
        return executeMove(gameState, move.from, move.to, move.promote);
    } else {
        return executeDrop(gameState, move.pieceType, move.to, player);
    }
};

// 評価関数
const evaluateBoard = (gameState: GameState, aiPlayer: Player): number => {
    if (gameState.winner === aiPlayer) return 10000;
    if (gameState.winner && gameState.winner !== aiPlayer) return -10000;

    let score = 0;

    // 1. 駒の価値 (盤上)
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                let value = getPieceValue(cell.type);
                if (cell.isPromoted) value *= 1.5;

                // 位置評価 (中央に近いほど少しプラス)
                const centerX = 4;
                const centerY = 4;
                const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
                const posBonus = (10 - dist) * 2;

                if (cell.owner === aiPlayer) {
                    score += value + posBonus;
                } else {
                    score -= value + posBonus;
                }
            }
        });
    });

    // 2. 持ち駒の価値
    gameState.hands[aiPlayer].forEach(p => score += getPieceValue(p.type) * 1.1); // 持ち駒は少し価値高く
    const opponent = aiPlayer === 'sente' ? 'gote' : 'sente';
    gameState.hands[opponent].forEach(p => score -= getPieceValue(p.type) * 1.1);

    return score;
};

const getPieceValue = (type: Piece['type']): number => {
    switch (type) {
        case 'king': return 1000;
        case 'rook': return 100;
        case 'bishop': return 100;
        case 'gold': return 60;
        case 'silver': return 50;
        case 'knight': return 40;
        case 'lance': return 30;
        case 'pawn': return 10;
        default: return 0;
    }
};
