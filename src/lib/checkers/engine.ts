import { Board, GameState, Move, Piece, PieceType, Player, Position, ROWS, COLS } from './types';

export function createInitialState(): GameState {
    const board: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    // Black (Top) - Rows 0, 1, 2, 3
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r + c) % 2 === 1) {
                board[r][c] = { type: 'man', owner: 'black' };
            }
        }
    }

    // Red (Bottom) - Rows 6, 7, 8, 9
    for (let r = 6; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r + c) % 2 === 1) {
                board[r][c] = { type: 'man', owner: 'red' };
            }
        }
    }

    return {
        board,
        turn: 'red', // Red moves first usually
        winner: null,
        history: [],
        mustJump: false,
        activePiece: null,
    };
}

export function getValidMoves(state: GameState, player: Player): Move[] {
    // If activePiece is set (multi-jump in progress), only that piece can move
    if (state.activePiece) {
        return getJumps(state.board, state.activePiece.r, state.activePiece.c, player);
    }

    const jumps: Move[] = [];
    const moves: Move[] = [];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = state.board[r][c];
            if (piece && piece.owner === player) {
                const pieceJumps = getJumps(state.board, r, c, player);
                jumps.push(...pieceJumps);

                if (pieceJumps.length === 0) {
                    moves.push(...getSimpleMoves(state.board, r, c, player));
                }
            }
        }
    }

    // Mandatory Jump Rule
    if (jumps.length > 0) {
        return jumps;
    }
    return moves;
}

function getSimpleMoves(board: Board, r: number, c: number, player: Player): Move[] {
    const moves: Move[] = [];
    const piece = board[r][c];
    if (!piece) return [];

    const directions = getDirections(piece.type, player);

    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;

        if (isValidPos(nr, nc) && board[nr][nc] === null) {
            moves.push({
                from: { r, c },
                to: { r: nr, c: nc },
                isJump: false
            });
        }
    }
    return moves;
}

function getJumps(board: Board, r: number, c: number, player: Player): Move[] {
    const jumps: Move[] = [];
    const piece = board[r][c];
    if (!piece) return [];

    const directions = getDirections(piece.type, player);

    for (const [dr, dc] of directions) {
        const midR = r + dr;
        const midC = c + dc;
        const toR = r + dr * 2;
        const toC = c + dc * 2;

        if (isValidPos(toR, toC)) {
            const midPiece = board[midR][midC];
            const target = board[toR][toC];

            if (midPiece && midPiece.owner !== player && target === null) {
                jumps.push({
                    from: { r, c },
                    to: { r: toR, c: toC },
                    isJump: true,
                    jumpedPiece: { r: midR, c: midC }
                });
            }
        }
    }
    return jumps;
}

function getDirections(type: PieceType, owner: Player): number[][] {
    const forward = owner === 'red' ? -1 : 1;
    if (type === 'king') {
        return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    }
    return [[forward, -1], [forward, 1]];
}

function isValidPos(r: number, c: number) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

export function move(state: GameState, moveAction: Move): GameState {
    const newState = JSON.parse(JSON.stringify(state));
    const { from, to, isJump, jumpedPiece } = moveAction;
    const player = newState.turn;
    const opponent = player === 'red' ? 'black' : 'red';

    const piece = newState.board[from.r][from.c];
    newState.board[to.r][to.c] = piece;
    newState.board[from.r][from.c] = null;

    if (isJump && jumpedPiece) {
        newState.board[jumpedPiece.r][jumpedPiece.c] = null;
    }

    // Promotion
    let promoted = false;
    if (piece.type === 'man') {
        if ((player === 'red' && to.r === 0) || (player === 'black' && to.r === ROWS - 1)) {
            newState.board[to.r][to.c].type = 'king';
            promoted = true;
        }
    }

    // Multi-jump check
    let multiJumpAvailable = false;
    if (isJump && !promoted) { // Cannot continue jumping if just promoted (usually)
        const furtherJumps = getJumps(newState.board, to.r, to.c, player);
        if (furtherJumps.length > 0) {
            multiJumpAvailable = true;
        }
    }

    if (multiJumpAvailable) {
        newState.activePiece = to;
        newState.mustJump = true;
        // Turn stays with current player
    } else {
        newState.activePiece = null;
        newState.mustJump = false;
        newState.turn = opponent;
    }

    newState.history.push(moveAction);

    // Check Win Condition (Opponent has no moves)
    const opponentMoves = getValidMoves(newState, newState.turn);
    if (opponentMoves.length === 0) {
        newState.winner = player; // The player who just moved wins if opponent cannot move
    }

    return newState;
}
