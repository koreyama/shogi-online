import { Board, GameState, Player, Coordinates, ROWS, COLS } from './types';

export function createInitialState(): GameState {
    const board: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    return {
        board,
        turn: 'red', // Red goes first usually
        winner: null,
        history: [],
        winningLine: null,
    };
}

export function getValidMoves(board: Board): number[] {
    const moves: number[] = [];
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === null) {
            moves.push(col);
        }
    }
    return moves;
}

export function dropPiece(state: GameState, col: number): GameState {
    if (state.winner || col < 0 || col >= COLS || state.board[0][col] !== null) {
        return state;
    }

    const newBoard = state.board.map(row => [...row]);
    let droppedRow = -1;

    // Find the lowest empty cell in the column
    for (let row = ROWS - 1; row >= 0; row--) {
        if (newBoard[row][col] === null) {
            newBoard[row][col] = state.turn;
            droppedRow = row;
            break;
        }
    }

    if (droppedRow === -1) return state; // Should be covered by valid check, but safety first

    const newHistory = [...state.history, col];
    const { winner, winningLine } = checkWinner(newBoard, droppedRow, col, state.turn);

    let nextTurn = state.turn === 'red' ? 'yellow' : 'red';
    if (winner) nextTurn = state.turn; // Game over, turn doesn't really matter but keep it consistent

    // Check for draw (board full)
    const isDraw = !winner && newBoard[0].every(cell => cell !== null);

    return {
        board: newBoard,
        turn: nextTurn as Player,
        winner: winner ? winner : (isDraw ? 'draw' : null),
        history: newHistory,
        winningLine: winningLine || null,
    };
}

function checkWinner(board: Board, lastRow: number, lastCol: number, player: Player): { winner: Player | null, winningLine: Coordinates[] | null } {
    const directions = [
        { r: 0, c: 1 },  // Horizontal
        { r: 1, c: 0 },  // Vertical
        { r: 1, c: 1 },  // Diagonal \
        { r: 1, c: -1 }  // Diagonal /
    ];

    for (const { r: dr, c: dc } of directions) {
        const line: Coordinates[] = [{ row: lastRow, col: lastCol }];

        // Check forward
        for (let i = 1; i < 4; i++) {
            const r = lastRow + dr * i;
            const c = lastCol + dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
            line.push({ row: r, col: c });
        }

        // Check backward
        for (let i = 1; i < 4; i++) {
            const r = lastRow - dr * i;
            const c = lastCol - dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
            line.push({ row: r, col: c });
        }

        if (line.length >= 4) {
            return { winner: player, winningLine: line };
        }
    }

    return { winner: null, winningLine: null };
}
