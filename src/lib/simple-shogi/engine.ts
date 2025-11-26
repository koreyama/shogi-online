import { Board, GameState, Piece, PieceType, Player, ROWS, COLS } from './types';

export function createInitialState(): GameState {
    const board: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    // Gote (Top)
    // Row 0: Giraffe(Rook), Lion(King), Elephant(Bishop)
    // Row 1: - Chick(Pawn) -
    board[0][0] = { type: 'rook', owner: 'gote' };
    board[0][1] = { type: 'king', owner: 'gote' };
    board[0][2] = { type: 'bishop', owner: 'gote' };
    board[1][1] = { type: 'pawn', owner: 'gote' };

    // Sente (Bottom)
    // Row 3: Elephant(Bishop), Lion(King), Giraffe(Rook)
    // Row 2: - Chick(Pawn) -
    board[3][0] = { type: 'bishop', owner: 'sente' };
    board[3][1] = { type: 'king', owner: 'sente' };
    board[3][2] = { type: 'rook', owner: 'sente' };
    board[2][1] = { type: 'pawn', owner: 'sente' };

    return {
        board,
        hands: { sente: {}, gote: {} },
        turn: 'sente',
        winner: null,
        history: [],
    };
}

export function getValidMoves(state: GameState, player: Player) {
    const moves = [];
    const { board, hands } = state;

    // Board moves
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = board[r][c];
            if (piece && piece.owner === player) {
                const destinations = getPieceMoves(piece.type, r, c, player);
                for (const [dr, dc] of destinations) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (isValidPos(nr, nc)) {
                        const target = board[nr][nc];
                        if (!target || target.owner !== player) {
                            moves.push({ from: { r, c }, to: { r: nr, c: nc }, isDrop: false, type: piece.type });
                        }
                    }
                }
            }
        }
    }

    // Drops
    const hand = hands[player];
    const emptyCells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!board[r][c]) emptyCells.push({ r, c });
        }
    }

    const droppableTypes: PieceType[] = ['rook', 'bishop', 'gold', 'pawn']; // King cannot be dropped

    for (const type of droppableTypes) {
        if (hand[type] && hand[type]! > 0) {
            for (const { r, c } of emptyCells) {
                // Dobutsu Shogi allows dropping pawn anywhere (no Nifu rule, no drop-mate restriction usually, but let's check)
                // Actually Dobutsu Shogi allows Two Pawns.
                // Drop on last rank:
                if (type === 'pawn') {
                    if (player === 'sente' && r === 0) continue; // Cannot drop where it can't move (and promote) ? 
                    // In Dobutsu Shogi, Chick promotes only when moving TO the zone. Dropping inside zone:
                    // "If a Chick is dropped into the promotion zone, it does not promote immediately."
                    // But can it move? No. So it's stuck.
                    // Usually prohibited to drop where it has no moves.
                    if (player === 'gote' && r === ROWS - 1) continue;
                }

                moves.push({ type, to: { r, c }, isDrop: true });
            }
        }
    }

    return moves;
}

function getPieceMoves(type: PieceType, r: number, c: number, owner: Player): number[][] {
    const forward = owner === 'sente' ? -1 : 1;

    switch (type) {
        case 'king': // Lion
            return [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        case 'rook': // Giraffe (1 step orthogonal)
            return [[-1, 0], [1, 0], [0, -1], [0, 1]];
        case 'bishop': // Elephant (1 step diagonal)
            return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        case 'gold': // Hen (Gold)
            return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1], [-forward, 0]];
        case 'pawn': // Chick (Forward 1)
            return [[forward, 0]];
    }
    return [];
}

function isValidPos(r: number, c: number) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

export function move(state: GameState, moveAction: any): GameState {
    const newState = JSON.parse(JSON.stringify(state));
    const { from, to, isDrop, type } = moveAction;
    const player = newState.turn;
    const opponent = player === 'sente' ? 'gote' : 'sente';

    if (isDrop) {
        newState.board[to.r][to.c] = { type, owner: player };
        newState.hands[player][type]--;
    } else {
        const piece = newState.board[from.r][from.c];
        const target = newState.board[to.r][to.c];

        // Capture
        if (target) {
            const capturedType = demote(target.type);
            newState.hands[player][capturedType] = (newState.hands[player][capturedType] || 0) + 1;
            if (target.type === 'king') {
                newState.winner = player;
                return newState;
            }
        }

        // Move
        newState.board[to.r][to.c] = piece;
        newState.board[from.r][from.c] = null;

        // Promotion (Chick -> Hen)
        const isPromotionZone = (player === 'sente' && to.r === 0) || (player === 'gote' && to.r === ROWS - 1);
        if (piece.type === 'pawn' && isPromotionZone) {
            newState.board[to.r][to.c].type = 'gold';
        }

        // Try Rule (Lion reaches end)
        if (piece.type === 'king' && isPromotionZone) {
            // Check if safe (not in check)
            // Simplified check: Can opponent capture King at 'to' position?
            // We need to check if any opponent piece can move to 'to'.
            if (!isSquareAttacked(newState.board, to.r, to.c, opponent)) {
                newState.winner = player;
                return newState;
            }
        }
    }

    newState.turn = opponent;
    newState.history.push(moveAction);

    return newState;
}

function isSquareAttacked(board: Board, r: number, c: number, attacker: Player): boolean {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const p = board[i][j];
            if (p && p.owner === attacker) {
                const moves = getPieceMoves(p.type, i, j, attacker);
                for (const [dr, dc] of moves) {
                    if (i + dr === r && j + dc === c) return true;
                }
            }
        }
    }
    return false;
}

function demote(type: PieceType): PieceType {
    if (type === 'gold') return 'pawn';
    return type;
}
