import { BoardState, GameState, Piece, Player, Position, Coordinates, Move, PieceType } from './types';
import { hasPawnInColumn, isUchifuzume, isCheckmate, isCheck } from './rules';

export const INITIAL_BOARD_SETUP = [
    ['lance', 'knight', 'silver', 'gold', 'king', 'gold', 'silver', 'knight', 'lance'],
    [null, 'rook', null, null, null, null, null, 'bishop', null],
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    [null, 'bishop', null, null, null, null, null, 'rook', null],
    ['lance', 'knight', 'silver', 'gold', 'king', 'gold', 'silver', 'knight', 'lance'],
];

export const createInitialState = (): GameState => {
    const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));

    const p = (type: string, owner: Player): Piece => ({
        type: type as any,
        owner,
        isPromoted: false,
        id: `${type}-${owner}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Gote (Top)
    board[0] = [
        p('lance', 'gote'), p('knight', 'gote'), p('silver', 'gote'), p('gold', 'gote'),
        p('king', 'gote'),
        p('gold', 'gote'), p('silver', 'gote'), p('knight', 'gote'), p('lance', 'gote')
    ];
    board[1][1] = p('rook', 'gote');
    board[1][7] = p('bishop', 'gote');
    board[2] = Array(9).fill(null).map(() => p('pawn', 'gote'));

    // Sente (Bottom)
    board[8] = [
        p('lance', 'sente'), p('knight', 'sente'), p('silver', 'sente'), p('gold', 'sente'),
        p('king', 'sente'),
        p('gold', 'sente'), p('silver', 'sente'), p('knight', 'sente'), p('lance', 'sente')
    ];
    board[7][1] = p('bishop', 'sente');
    board[7][7] = p('rook', 'sente');
    board[6] = Array(9).fill(null).map(() => p('pawn', 'sente'));

    return {
        board,
        turn: 'sente',
        hands: { sente: [], gote: [] },
        selectedPosition: null,
        history: [],
        winner: null,
        isCheck: false
    };
};

export const canPromote = (piece: Piece, fromY: number, toY: number): boolean => {
    if (piece.isPromoted || ['gold', 'king'].includes(piece.type)) return false;

    const promotionZoneSente = [0, 1, 2];
    const promotionZoneGote = [6, 7, 8];

    if (piece.owner === 'sente') {
        return promotionZoneSente.includes(toY) || promotionZoneSente.includes(fromY);
    } else {
        return promotionZoneGote.includes(toY) || promotionZoneGote.includes(fromY);
    }
};

const cloneBoard = (board: BoardState): BoardState => {
    return board.map(row => [...row]);
};

export const executeMove = (
    state: GameState,
    from: Coordinates,
    to: Coordinates,
    promote: boolean
): GameState => {
    const newBoard = cloneBoard(state.board);
    const piece = newBoard[from.y][from.x]!;
    const targetCell = newBoard[to.y][to.x];

    // Handle capture
    const newHands = { ...state.hands };
    if (targetCell) {
        const capturedPiece = {
            ...targetCell,
            owner: state.turn,
            isPromoted: false, // Reset promotion on capture
            id: `${targetCell.type}-${state.turn}-${Math.random().toString(36).substr(2, 9)}`
        };
        newHands[state.turn] = [...newHands[state.turn], capturedPiece];
    }

    // Move piece
    newBoard[from.y][from.x] = null;
    newBoard[to.y][to.x] = {
        ...piece,
        isPromoted: piece.isPromoted || promote
    };

    const nextTurn = state.turn === 'sente' ? 'gote' : 'sente';
    const isMate = isCheckmate(newBoard, nextTurn, newHands);

    return {
        ...state,
        board: newBoard,
        turn: nextTurn,
        hands: newHands,
        selectedPosition: null,
        history: [...state.history, {
            from,
            to,
            piece,
            isPromotion: promote,
            capturedPiece: targetCell || undefined
        }],
        winner: isMate ? state.turn : null,
        isCheck: isCheck(newBoard, nextTurn)
    };
};

export const executeDrop = (
    state: GameState,
    pieceType: PieceType, // Changed from pieceId
    to: Coordinates,
    owner?: Player // オプショナルパラメータとして追加
): GameState => {
    try {
        const newBoard = cloneBoard(state.board);
        const newHands = { ...state.hands };

        // ownerが指定されていない場合はstate.turnを使用
        const player = owner || state.turn;

        const handIndex = newHands[player].findIndex(p => p.type === pieceType);
        if (handIndex === -1) return state; // Should not happen

        const piece = newHands[player][handIndex];

        // Nifu Check
        if (piece.type === 'pawn' && hasPawnInColumn(state.board, to.x, player)) {
            return state;
        }

        // Uchifuzume Check
        if (piece.type === 'pawn' && isUchifuzume(state.board, to, player, state.hands)) {
            return state;
        }

        newHands[player] = [
            ...newHands[player].slice(0, handIndex),
            ...newHands[player].slice(handIndex + 1)
        ];

        newBoard[to.y][to.x] = piece;

        const nextTurn = player === 'sente' ? 'gote' : 'sente';
        const isMate = isCheckmate(newBoard, nextTurn, newHands);

        return {
            ...state,
            board: newBoard,
            turn: nextTurn,
            hands: newHands,
            selectedPosition: null,
            history: [...state.history, {
                from: 'hand',
                to,
                piece,
            }],
            winner: isMate ? player : null,
            isCheck: isCheck(newBoard, nextTurn)
        };
    } catch (e) {
        console.error('Error in executeDrop:', e);
        return state;
    }
};
