import { BoardState, GameState, Player, Move, BOARD_SIZE } from './types';

export const createInitialState = (): GameState => {
    const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    return {
        board,
        turn: 'black',
        winner: null,
        history: [],
        isGameOver: false,
    };
};

export const isValidMove = (board: BoardState, x: number, y: number): boolean => {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
        return false;
    }
    return board[y][x] === null;
};

export const executeMove = (currentState: GameState, x: number, y: number): GameState => {
    if (currentState.isGameOver || !isValidMove(currentState.board, x, y)) {
        return currentState;
    }

    const newBoard = currentState.board.map(row => [...row]);
    newBoard[y][x] = currentState.turn;

    const newHistory = [...currentState.history, { x, y, player: currentState.turn }];
    const winner = checkWinner(newBoard, x, y, currentState.turn);

    // Check for draw (board full)
    let isDraw = false;
    if (!winner) {
        isDraw = newBoard.every(row => row.every(cell => cell !== null));
    }

    const nextTurn = currentState.turn === 'black' ? 'white' : 'black';

    return {
        board: newBoard,
        turn: nextTurn,
        winner: winner ? winner : (isDraw ? 'draw' : null),
        history: newHistory,
        isGameOver: !!winner || isDraw,
    };
};

const checkWinner = (board: BoardState, lastX: number, lastY: number, player: Player): Player | null => {
    const directions = [
        { dx: 1, dy: 0 },  // Horizontal
        { dx: 0, dy: 1 },  // Vertical
        { dx: 1, dy: 1 },  // Diagonal \
        { dx: 1, dy: -1 }, // Diagonal /
    ];

    for (const { dx, dy } of directions) {
        let count = 1;

        // Check forward
        let x = lastX + dx;
        let y = lastY + dy;
        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === player) {
            count++;
            x += dx;
            y += dy;
        }

        // Check backward
        x = lastX - dx;
        y = lastY - dy;
        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === player) {
            count++;
            x -= dx;
            y -= dy;
        }

        if (count >= 5) {
            return player;
        }
    }

    return null;
};
