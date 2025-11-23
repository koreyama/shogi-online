import { BoardState, Player, Coordinates, GameState } from './types';

export const INITIAL_BOARD: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
// 初期配置
INITIAL_BOARD[3][3] = 'white';
INITIAL_BOARD[3][4] = 'black';
INITIAL_BOARD[4][3] = 'black';
INITIAL_BOARD[4][4] = 'white';

export const createInitialState = (): GameState => ({
    board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
    turn: 'black',
    winner: null,
    history: [],
    blackCount: 2,
    whiteCount: 2,
    canMove: true
});

const DIRECTIONS = [
    { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
    { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
];

export const isValidMove = (board: BoardState, player: Player, x: number, y: number): boolean => {
    if (board[y][x] !== null) return false;
    return getFlippableStones(board, player, x, y).length > 0;
};

export const getFlippableStones = (board: BoardState, player: Player, x: number, y: number): Coordinates[] => {
    const opponent = player === 'black' ? 'white' : 'black';
    const flippable: Coordinates[] = [];

    for (const dir of DIRECTIONS) {
        let nx = x + dir.dx;
        let ny = y + dir.dy;
        const temp: Coordinates[] = [];

        while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && board[ny][nx] === opponent) {
            temp.push({ x: nx, y: ny });
            nx += dir.dx;
            ny += dir.dy;
        }

        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && board[ny][nx] === player && temp.length > 0) {
            flippable.push(...temp);
        }
    }

    return flippable;
};

export const getValidMoves = (board: BoardState, player: Player): Coordinates[] => {
    const moves: Coordinates[] = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (isValidMove(board, player, x, y)) {
                moves.push({ x, y });
            }
        }
    }
    return moves;
};

export const executeMove = (state: GameState, x: number, y: number): GameState => {
    const newBoard = JSON.parse(JSON.stringify(state.board));
    const player = state.turn;
    const flippable = getFlippableStones(newBoard, player, x, y);

    if (flippable.length === 0) return state;

    newBoard[y][x] = player;
    for (const p of flippable) {
        newBoard[p.y][p.x] = player;
    }

    const nextTurn: Player = player === 'black' ? 'white' : 'black';

    // カウント更新
    let black = 0;
    let white = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (newBoard[r][c] === 'black') black++;
            else if (newBoard[r][c] === 'white') white++;
        }
    }

    // 次のプレイヤーが置けるかチェック
    const nextValidMoves = getValidMoves(newBoard, nextTurn);
    const canNextMove = nextValidMoves.length > 0;

    // もし次のプレイヤーが置けなければ、さらにその次（今のプレイヤー）が置けるかチェック
    let finalNextTurn: Player = nextTurn;
    let finalCanMove = canNextMove;

    if (!canNextMove) {
        // パス
        const currentValidMoves = getValidMoves(newBoard, player);
        if (currentValidMoves.length > 0) {
            finalNextTurn = player;
            finalCanMove = true;
        } else {
            // 両者置けない -> 終了
            finalCanMove = false;
        }
    }

    let winner: Player | 'draw' | null = null;
    if (!finalCanMove) {
        if (black > white) winner = 'black';
        else if (white > black) winner = 'white';
        else winner = 'draw';
    }

    return {
        ...state,
        board: newBoard,
        turn: finalNextTurn,
        winner,
        history: [...state.history, { x, y, player, flipped: flippable }],
        blackCount: black,
        whiteCount: white,
        canMove: finalCanMove
    };
};
