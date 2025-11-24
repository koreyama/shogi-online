import { BoardState, GameState, Player, Piece, PieceType, Move, Coordinates, BOARD_SIZE } from './types';

export const createInitialState = (): GameState => {
    const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

    const setupRow = (row: number, player: Player) => {
        const pieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        pieces.forEach((type, col) => {
            board[row][col] = { type, player, hasMoved: false };
        });
    };

    const setupPawns = (row: number, player: Player) => {
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = { type: 'pawn', player, hasMoved: false };
        }
    };

    setupRow(0, 'black');
    setupPawns(1, 'black');
    setupPawns(6, 'white');
    setupRow(7, 'white');

    return {
        board,
        turn: 'white',
        winner: null,
        isGameOver: false,
        history: [],
        inCheck: false,
    };
};

export const isValidMove = (state: GameState, from: Coordinates, to: Coordinates): boolean => {
    const piece = state.board[from.y][from.x];
    if (!piece || piece.player !== state.turn) return false;
    if (to.x < 0 || to.x >= BOARD_SIZE || to.y < 0 || to.y >= BOARD_SIZE) return false;

    const target = state.board[to.y][to.x];
    if (target && target.player === piece.player) return false; // 味方の駒は取れない

    // 移動ルールチェック
    if (!canPieceMove(state.board, from, to, piece)) return false;

    // 移動後にチェックされないか確認
    const tempBoard = simulateMove(state.board, from, to);
    if (isCheck(tempBoard, state.turn)) return false;

    return true;
};

const canPieceMove = (board: BoardState, from: Coordinates, to: Coordinates, piece: Piece): boolean => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    switch (piece.type) {
        case 'pawn': {
            const direction = piece.player === 'white' ? -1 : 1;
            const startRow = piece.player === 'white' ? 6 : 1;

            // 通常移動
            if (dx === 0 && dy === direction && !board[to.y][to.x]) return true;
            // 2歩移動
            if (dx === 0 && dy === direction * 2 && from.y === startRow && !board[to.y][to.x] && !board[from.y + direction][from.x]) return true;
            // 斜め移動（攻撃）
            if (absDx === 1 && dy === direction && board[to.y][to.x] && board[to.y][to.x]?.player !== piece.player) return true;

            // アンパッサンは省略（簡易実装）
            return false;
        }
        case 'rook':
            if (dx !== 0 && dy !== 0) return false;
            return isPathClear(board, from, to);
        case 'knight':
            return (absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1);
        case 'bishop':
            if (absDx !== absDy) return false;
            return isPathClear(board, from, to);
        case 'queen':
            if (dx !== 0 && dy !== 0 && absDx !== absDy) return false;
            return isPathClear(board, from, to);
        case 'king':
            // 通常移動
            if (absDx <= 1 && absDy <= 1) return true;
            // キャスリング（簡易実装: 未移動のルークとキングの間に駒がないこと、チェックされていないこと等は executeMove で処理するか、ここでもチェックするか）
            // ここでは簡易的に、移動ルールとしてはNGとし、executeMoveで特別扱いするか、あるいはここでチェックするか。
            // キャスリングは複雑なので、今回は省略し、キングは1マス移動のみとする（安全策）。
            return false;
    }
};

const isPathClear = (board: BoardState, from: Coordinates, to: Coordinates): boolean => {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let x = from.x + dx;
    let y = from.y + dy;

    while (x !== to.x || y !== to.y) {
        if (board[y][x]) return false;
        x += dx;
        y += dy;
    }
    return true;
};

const simulateMove = (board: BoardState, from: Coordinates, to: Coordinates): BoardState => {
    const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
    newBoard[to.y][to.x] = newBoard[from.y][from.x];
    newBoard[from.y][from.x] = null;
    return newBoard;
};

const isCheck = (board: BoardState, player: Player): boolean => {
    // キングの位置を探す
    let kingPos: Coordinates | null = null;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const p = board[y][x];
            if (p && p.type === 'king' && p.player === player) {
                kingPos = { x, y };
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return true; // キングがいない（ありえないが）

    // 相手の駒がキングを攻撃できるかチェック
    const opponent = player === 'white' ? 'black' : 'white';
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const p = board[y][x];
            if (p && p.player === opponent) {
                if (canPieceMove(board, { x, y }, kingPos, p)) return true;
            }
        }
    }
    return false;
};

export const executeMove = (currentState: GameState, from: Coordinates, to: Coordinates): GameState => {
    if (!isValidMove(currentState, from, to)) return currentState;

    const newBoard = currentState.board.map(row => row.map(p => p ? { ...p } : null));
    const piece = newBoard[from.y][from.x]!;

    // プロモーション（ポーンが端に到達したらクイーンに）
    if (piece.type === 'pawn' && (to.y === 0 || to.y === 7)) {
        piece.type = 'queen';
    }

    piece.hasMoved = true;
    newBoard[to.y][to.x] = piece;
    newBoard[from.y][from.x] = null;

    const nextTurn = currentState.turn === 'white' ? 'black' : 'white';
    const inCheck = isCheck(newBoard, nextTurn);

    let isGameOver = false;
    let winner = currentState.winner;

    // チェックメイト判定
    if (inCheck) {
        if (isCheckmate(newBoard, nextTurn)) {
            isGameOver = true;
            winner = currentState.turn;
        }
    } else {
        // ステイルメイト判定（今回は省略、引き分けなし）
    }

    return {
        board: newBoard,
        turn: nextTurn,
        winner,
        isGameOver,
        history: [...currentState.history, { from, to }],
        inCheck,
    };
};

const isCheckmate = (board: BoardState, player: Player): boolean => {
    // すべての自分の駒について、有効な手があるかチェック
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const p = board[y][x];
            if (p && p.player === player) {
                // 盤面全体への移動を試す（非効率だが確実）
                for (let dy = 0; dy < BOARD_SIZE; dy++) {
                    for (let dx = 0; dx < BOARD_SIZE; dx++) {
                        // isValidMoveのロジックを再利用（ただしstateが必要なので、簡易的にここでロジック展開）
                        // canPieceMove && !simulateMove causes check
                        if (canPieceMove(board, { x, y }, { x: dx, y: dy }, p)) {
                            const target = board[dy][dx];
                            if (!target || target.player !== player) {
                                const tempBoard = simulateMove(board, { x, y }, { x: dx, y: dy });
                                if (!isCheck(tempBoard, player)) return false; // 回避できる手がある
                            }
                        }
                    }
                }
            }
        }
    }
    return true; // 手がない
};
