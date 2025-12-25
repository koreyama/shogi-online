export type PlayerColor = 'black' | 'white';
export type CellState = PlayerColor | null; // null=Empty
export type BoardState = CellState[]; // 1D Array, size 225

export interface GameState {
    board: number[]; // 0=Empty, 1=Black, 2=White
    turn: PlayerColor;
    winner: PlayerColor | 'draw' | null;
    isGameOver: boolean;
    lastMove?: { x: number, y: number };
}

const BOARD_SIZE = 15;

export function createInitialState(): GameState {
    return {
        board: Array(BOARD_SIZE * BOARD_SIZE).fill(0),
        turn: 'black',
        winner: null,
        isGameOver: false
    };
}

export function isValidMove(state: GameState, x: number, y: number): boolean {
    if (state.isGameOver) return false;
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return false;
    const index = y * BOARD_SIZE + x;
    return state.board[index] === 0;
}

export function executeMove(state: GameState, x: number, y: number): GameState {
    if (!isValidMove(state, x, y)) return state;

    const newBoard = [...state.board];
    const index = y * BOARD_SIZE + x;
    const colorCode = state.turn === 'black' ? 1 : 2;
    newBoard[index] = colorCode;

    const newState: GameState = {
        ...state,
        board: newBoard,
        lastMove: { x, y },
        turn: state.turn === 'black' ? 'white' : 'black', // Tentative, will be overridden if game over
        winner: state.winner,
        isGameOver: state.isGameOver
    };

    // Check Win
    if (checkWin(newBoard, x, y, colorCode)) {
        newState.winner = state.turn;
        newState.isGameOver = true;
    } else if (newBoard.every(c => c !== 0)) {
        newState.winner = 'draw';
        newState.isGameOver = true;
    } else {
        // Turn already switched above
    }

    return newState;
}

function checkWin(board: number[], x: number, y: number, color: number): boolean {
    const directions = [
        [1, 0],  // Horizontal
        [0, 1],  // Vertical
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    for (const [dx, dy] of directions) {
        let count = 1;

        // Check forward
        let cx = x + dx;
        let cy = y + dy;
        while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && board[cy * BOARD_SIZE + cx] === color) {
            count++;
            cx += dx;
            cy += dy;
        }

        // Check backward
        cx = x - dx;
        cy = y - dy;
        while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && board[cy * BOARD_SIZE + cx] === color) {
            count++;
            cx -= dx;
            cy -= dy;
        }

        if (count >= 5) return true;
    }
    return false;
}
