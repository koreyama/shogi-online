import { BoardState, Player, Move, BOARD_SIZE } from './types';
import { isValidMove } from './engine';

const MAX_DEPTH = 2; // 探索深さ（パフォーマンス考慮）

// 評価スコア
const SCORES = {
    WIN: 100000,
    OPEN_FOUR: 10000, // 両端が開いた4連
    FOUR: 1000,       // 片端が閉じた4連
    OPEN_THREE: 1000, // 両端が開いた3連
    THREE: 100,       // 片端が閉じた3連
    OPEN_TWO: 100,    // 両端が開いた2連
    TWO: 10,          // 片端が閉じた2連
};

export const getBestMove = (board: BoardState, player: Player): Move | null => {
    // 最初の数手は中心付近に打つ（探索省略）
    let stoneCount = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== null) stoneCount++;
        }
    }

    if (stoneCount === 0) {
        return { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2), player };
    }

    // 有効な手を列挙（石の周囲のみ探索対象にするなどの最適化が必要だが、まずは全探索に近い形で）
    // パフォーマンスのため、既存の石の周囲2マス以内のみを候補とする
    const candidates = getCandidateMoves(board);

    if (candidates.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove: Move | null = null;

    for (const move of candidates) {
        const newBoard = board.map(row => [...row]);
        newBoard[move.y][move.x] = player;

        const score = minimax(newBoard, MAX_DEPTH - 1, false, -Infinity, Infinity, player);

        if (score > bestScore) {
            bestScore = score;
            bestMove = { x: move.x, y: move.y, player };
        }
    }

    return bestMove || { x: candidates[0].x, y: candidates[0].y, player };
};

const getCandidateMoves = (board: BoardState): { x: number, y: number }[] => {
    const candidates: { x: number, y: number }[] = [];
    const visited = new Set<string>();

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== null) {
                // 周囲2マスを候補に追加
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < BOARD_SIZE && nx >= 0 && nx < BOARD_SIZE && board[ny][nx] === null) {
                            const key = `${nx},${ny}`;
                            if (!visited.has(key)) {
                                candidates.push({ x: nx, y: ny });
                                visited.add(key);
                            }
                        }
                    }
                }
            }
        }
    }

    // 候補がない（初手など）場合は中心を返す
    if (candidates.length === 0 && board[Math.floor(BOARD_SIZE / 2)][Math.floor(BOARD_SIZE / 2)] === null) {
        candidates.push({ x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) });
    }

    return candidates;
};

const minimax = (
    board: BoardState,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    player: Player
): number => {
    const opponent = player === 'black' ? 'white' : 'black';
    const score = evaluateBoard(board, player);

    // 終了条件
    if (Math.abs(score) >= SCORES.WIN / 2) return score; // 勝敗がついている
    if (depth === 0) return score;

    const candidates = getCandidateMoves(board);
    if (candidates.length === 0) return 0; // 引き分け

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of candidates) {
            const newBoard = board.map(row => [...row]);
            newBoard[move.y][move.x] = player;
            const evalScore = minimax(newBoard, depth - 1, false, alpha, beta, player);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of candidates) {
            const newBoard = board.map(row => [...row]);
            newBoard[move.y][move.x] = opponent;
            const evalScore = minimax(newBoard, depth - 1, true, alpha, beta, player);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

const evaluateBoard = (board: BoardState, player: Player): number => {
    const opponent = player === 'black' ? 'white' : 'black';
    let score = 0;

    // 縦横斜めを走査してパターンマッチング
    // 簡易的な評価関数
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 },
    ];

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== null) {
                // 各方向について連をチェック
                // 重複カウントを避けるため、始点のみで評価するか、全走査して割るか
                // ここでは簡易的に、各セルから4方向を見る（重複ありだが相対評価なので許容）

                for (const { dx, dy } of directions) {
                    score += evaluateLine(board, x, y, dx, dy, player, opponent);
                }
            }
        }
    }

    return score;
};

const evaluateLine = (
    board: BoardState,
    x: number,
    y: number,
    dx: number,
    dy: number,
    player: Player,
    opponent: Player
): number => {
    // このセルを始点とする連を評価するわけではないが、
    // このセルを含むラインを評価する

    // 簡易実装: 5つ並び、4つ並びなどを検出
    // 本格的な評価は複雑なので、ここでは「自分の石が並んでいる数」を重視

    let myCount = 0;
    let oppCount = 0;
    let emptyCount = 0;

    // 5マス分を見る
    for (let i = 0; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;

        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return 0; // 盤外を含むラインは無視（5連になれない）

        const cell = board[ny][nx];
        if (cell === player) myCount++;
        else if (cell === opponent) oppCount++;
        else emptyCount++;
    }

    if (myCount === 5) return SCORES.WIN;
    if (oppCount === 5) return -SCORES.WIN;

    if (myCount === 4 && emptyCount === 1) return SCORES.OPEN_FOUR; // 実際は端が空いているか見る必要があるが簡易化
    if (oppCount === 4 && emptyCount === 1) return -SCORES.OPEN_FOUR * 1.2; // 防御優先

    if (myCount === 3 && emptyCount === 2) return SCORES.OPEN_THREE;
    if (oppCount === 3 && emptyCount === 2) return -SCORES.OPEN_THREE * 1.2;

    if (myCount === 2 && emptyCount === 3) return SCORES.TWO;
    if (oppCount === 2 && emptyCount === 3) return -SCORES.TWO;

    return 0;
};
