import { Piece, Player, BoardState, Coordinates } from './types';

// Helper to check if position is on board
const isValidPos = (x: number, y: number): boolean => {
    return x >= 0 && x < 9 && y >= 0 && y < 9;
};

// Helper to check if a cell is occupied by own piece
const isOwnPiece = (board: BoardState, x: number, y: number, player: Player): boolean => {
    const cell = board[y][x];
    return cell !== null && cell.owner === player;
};

export const hasPawnInColumn = (board: BoardState, x: number, player: Player): boolean => {
    for (let y = 0; y < 9; y++) {
        const cell = board[y][x];
        if (cell && cell.type === 'pawn' && cell.owner === player && !cell.isPromoted) {
            return true;
        }
    }
    return false;
};

export const isForcedPromotion = (piece: Piece, y: number): boolean => {
    if (piece.isPromoted) return false;

    if (piece.owner === 'sente') {
        // Sente moves UP (y decreases). Top is 0.
        if (piece.type === 'pawn' || piece.type === 'lance') {
            return y === 0;
        }
        if (piece.type === 'knight') {
            return y <= 1;
        }
    } else {
        // Gote moves DOWN (y increases). Bottom is 8.
        if (piece.type === 'pawn' || piece.type === 'lance') {
            return y === 8;
        }
        if (piece.type === 'knight') {
            return y >= 7;
        }
    }
    return false;
};

export const getValidMoves = (
    board: BoardState,
    piece: Piece,
    pos: Coordinates
): Coordinates[] => {
    const moves: Coordinates[] = [];
    const { x, y } = pos;
    const direction = piece.owner === 'sente' ? -1 : 1; // Sente moves up (y decreases), Gote moves down (y increases)

    // Movement patterns (dx, dy) relative to piece
    // dx: -1 (left), 1 (right)
    // dy: -1 (up/forward for Sente), 1 (down/backward for Sente)
    // NOTE: Since y=0 is top, Sente "forward" is y-1. Gote "forward" is y+1.

    const forward = direction;

    let patterns: { dx: number; dy: number; slide?: boolean }[] = [];

    const goldMoves = [
        { dx: -1, dy: forward }, { dx: 0, dy: forward }, { dx: 1, dy: forward }, // Forward 3
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // Side 2
        { dx: 0, dy: -forward } // Back 1
    ];

    if (piece.isPromoted) {
        switch (piece.type) {
            case 'rook': // Dragon
                patterns = [
                    { dx: 0, dy: -1, slide: true }, { dx: 0, dy: 1, slide: true },
                    { dx: -1, dy: 0, slide: true }, { dx: 1, dy: 0, slide: true },
                    { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
                ];
                break;
            case 'bishop': // Horse
                patterns = [
                    { dx: -1, dy: -1, slide: true }, { dx: 1, dy: -1, slide: true },
                    { dx: -1, dy: 1, slide: true }, { dx: 1, dy: 1, slide: true },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                ];
                break;
            default: // Promoted Silver, Knight, Lance, Pawn behave like Gold
                patterns = goldMoves;
                break;
        }
    } else {
        switch (piece.type) {
            case 'pawn':
                patterns = [{ dx: 0, dy: forward }];
                break;
            case 'lance':
                patterns = [{ dx: 0, dy: forward, slide: true }];
                break;
            case 'knight':
                patterns = [{ dx: -1, dy: forward * 2 }, { dx: 1, dy: forward * 2 }];
                break;
            case 'silver':
                patterns = [
                    { dx: -1, dy: forward }, { dx: 0, dy: forward }, { dx: 1, dy: forward }, // Forward 3
                    { dx: -1, dy: -forward }, { dx: 1, dy: -forward } // Back diagonals
                ];
                break;
            case 'gold':
                patterns = goldMoves;
                break;
            case 'bishop':
                patterns = [
                    { dx: -1, dy: -1, slide: true }, { dx: 1, dy: -1, slide: true },
                    { dx: -1, dy: 1, slide: true }, { dx: 1, dy: 1, slide: true }
                ];
                break;
            case 'rook':
                patterns = [
                    { dx: 0, dy: -1, slide: true }, { dx: 0, dy: 1, slide: true },
                    { dx: -1, dy: 0, slide: true }, { dx: 1, dy: 0, slide: true }
                ];
                break;
            case 'king':
                patterns = [
                    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
                ];
                break;
        }
    }

    for (const pattern of patterns) {
        let nextX = x + pattern.dx;
        let nextY = y + pattern.dy;

        if (pattern.slide) {
            while (isValidPos(nextX, nextY)) {
                if (isOwnPiece(board, nextX, nextY, piece.owner)) break;

                moves.push({ x: nextX, y: nextY });

                // Stop if we hit an enemy piece (capture)
                if (board[nextY][nextX] !== null) break;

                nextX += pattern.dx;
                nextY += pattern.dy;
            }
        } else {
            if (isValidPos(nextX, nextY) && !isOwnPiece(board, nextX, nextY, piece.owner)) {
                moves.push({ x: nextX, y: nextY });
            }
        }
    }

    return moves;
};

export const findKing = (board: BoardState, player: Player): Coordinates | null => {
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = board[y][x];
            if (cell && cell.type === 'king' && cell.owner === player) {
                return { x, y };
            }
        }
    }
    return null;
};

export const isCheck = (board: BoardState, player: Player): boolean => {
    const kingPos = findKing(board, player);
    if (!kingPos) return false; // Should not happen in normal game

    const opponent = player === 'sente' ? 'gote' : 'sente';

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = board[y][x];
            if (cell && cell.owner === opponent) {
                const moves = getValidMoves(board, cell, { x, y });
                if (moves.some(m => m.x === kingPos.x && m.y === kingPos.y)) {
                    return true;
                }
            }
        }
    }
    return false;
};

export const getLegalMoves = (
    board: BoardState,
    piece: Piece,
    pos: Coordinates
): Coordinates[] => {
    const validMoves = getValidMoves(board, piece, pos);
    const legalMoves: Coordinates[] = [];

    // Temporarily modify board to check for check
    const originalSource = board[pos.y][pos.x];
    board[pos.y][pos.x] = null;

    for (const move of validMoves) {
        const originalTarget = board[move.y][move.x];

        // Move piece
        board[move.y][move.x] = piece; // Use same piece object for check

        if (!isCheck(board, piece.owner)) {
            legalMoves.push(move);
        }

        // Restore target
        board[move.y][move.x] = originalTarget;
    }

    // Restore source
    board[pos.y][pos.x] = originalSource;

    return legalMoves;
};

const getCheckers = (board: BoardState, player: Player): { piece: Piece, pos: Coordinates }[] => {
    const kingPos = findKing(board, player);
    if (!kingPos) return [];

    const checkers: { piece: Piece, pos: Coordinates }[] = [];
    const opponent = player === 'sente' ? 'gote' : 'sente';

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = board[y][x];
            if (cell && cell.owner === opponent) {
                const moves = getValidMoves(board, cell, { x, y });
                if (moves.some(m => m.x === kingPos.x && m.y === kingPos.y)) {
                    checkers.push({ piece: cell, pos: { x, y } });
                }
            }
        }
    }
    return checkers;
};

const getInterpositions = (kingPos: Coordinates, checkerPos: Coordinates): Coordinates[] => {
    const dx = checkerPos.x - kingPos.x;
    const dy = checkerPos.y - kingPos.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    // Not a sliding move (knight, pawn, etc) or adjacent
    if (steps <= 1 || (Math.abs(dx) !== Math.abs(dy) && dx !== 0 && dy !== 0)) {
        return [];
    }

    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    const interpositions: Coordinates[] = [];
    let cx = kingPos.x + stepX;
    let cy = kingPos.y + stepY;
    let safety = 0;

    while ((cx !== checkerPos.x || cy !== checkerPos.y) && safety < 10) {
        interpositions.push({ x: cx, y: cy });
        cx += stepX;
        cy += stepY;
        safety++;
    }

    return interpositions;
};

export const isCheckmate = (board: BoardState, player: Player, hands: { [key in Player]: Piece[] }): boolean => {
    // 1. Not in check? Not checkmate.
    if (!isCheck(board, player)) {
        // console.log(`[Checkmate] ${player} is not in check`);
        return false;
    }
    console.log(`[Checkmate] ${player} IS in check. Checking for mate...`);

    const kingPos = findKing(board, player);
    if (!kingPos) return true;

    // 2. Can King move?
    const kingMoves = getValidMoves(board, { type: 'king', owner: player, isPromoted: false, id: 'temp-king' }, kingPos);
    for (const move of kingMoves) {
        const originalTarget = board[move.y][move.x];
        board[move.y][move.x] = board[kingPos.y][kingPos.x];
        board[kingPos.y][kingPos.x] = null;

        const stillCheck = isCheck(board, player);

        board[kingPos.y][kingPos.x] = board[move.y][move.x];
        board[move.y][move.x] = originalTarget;

        if (!stillCheck) {
            console.log(`[Checkmate] King can escape to ${move.x},${move.y}`);
            return false;
        }
    }

    // 3. Get Checkers
    const checkers = getCheckers(board, player);
    if (checkers.length > 1) {
        console.log(`[Checkmate] Double check, and King cannot move. Mate.`);
        return true;
    }

    const checker = checkers[0];
    console.log(`[Checkmate] Single checker: ${checker.piece.type} at ${checker.pos.x},${checker.pos.y}`);

    // 4. Can capture checker?
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = board[y][x];
            if (cell && cell.owner === player && cell.type !== 'king') {
                const moves = getValidMoves(board, cell, { x, y });
                if (moves.some(m => m.x === checker.pos.x && m.y === checker.pos.y)) {
                    // Try capture
                    const originalSource = board[y][x];
                    const originalTarget = board[checker.pos.y][checker.pos.x];

                    board[checker.pos.y][checker.pos.x] = cell;
                    board[y][x] = null;

                    const stillCheck = isCheck(board, player);

                    board[y][x] = originalSource;
                    board[checker.pos.y][checker.pos.x] = originalTarget;

                    if (!stillCheck) {
                        console.log(`[Checkmate] Checker can be captured by ${cell.type} at ${x},${y}`);
                        return false;
                    }
                }
            }
        }
    }

    // 5. Can block? (Interposition)
    const interpositions = getInterpositions(kingPos, checker.pos);
    if (interpositions.length > 0) {
        console.log(`[Checkmate] Interpositions available:`, interpositions);
        // Move to block
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = board[y][x];
                if (cell && cell.owner === player && cell.type !== 'king') {
                    const moves = getValidMoves(board, cell, { x, y });
                    for (const target of interpositions) {
                        if (moves.some(m => m.x === target.x && m.y === target.y)) {
                            // Try block
                            const originalSource = board[y][x];
                            const originalTarget = board[target.y][target.x];

                            board[target.y][target.x] = cell;
                            board[y][x] = null;

                            const stillCheck = isCheck(board, player);

                            board[y][x] = originalSource;
                            board[target.y][target.x] = originalTarget;

                            if (!stillCheck) {
                                console.log(`[Checkmate] Can block with ${cell.type} from ${x},${y} to ${target.x},${target.y}`);
                                return false;
                            }
                        }
                    }
                }
            }
        }

        // Drop to block
        const hand = hands[player];
        const uniqueHandPieces = Array.from(new Set(hand.map(p => p.type)))
            .map(type => hand.find(p => p.type === type)!);

        for (const piece of uniqueHandPieces) {
            for (const target of interpositions) {
                if (piece.type === 'pawn' && hasPawnInColumn(board, target.x, player)) continue;

                board[target.y][target.x] = piece;
                const stillCheck = isCheck(board, player);
                board[target.y][target.x] = null;

                if (!stillCheck) {
                    console.log(`[Checkmate] Can drop block with ${piece.type} at ${target.x},${target.y}`);
                    return false;
                }
            }
        }
    }

    console.log(`[Checkmate] Mate confirmed!`);
    return true;
};

export const isUchifuzume = (
    board: BoardState,
    dropPos: Coordinates,
    player: Player, // The player DROPPING the pawn
    hands: { [key in Player]: Piece[] }
): boolean => {
    return false; // Temporarily disabled to prevent freezing
};

export const getValidDrops = (
    board: BoardState,
    piece: Piece,
    player: Player,
    hands: { [key in Player]: Piece[] }
): Coordinates[] => {
    const drops: Coordinates[] = [];

    // Optimization: If not currently in check, drops cannot cause self-check
    const isCurrentlyInCheck = isCheck(board, player);

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            if (board[y][x] === null) {
                // 1. Nifu Check
                if (piece.type === 'pawn' && hasPawnInColumn(board, x, player)) continue;

                // 2. Forced Promotion Check (Cannot drop where it has no moves)
                if (isForcedPromotion(piece, y)) continue;

                // 3. Uchifuzume Check
                if (piece.type === 'pawn' && isUchifuzume(board, { x, y }, player, hands)) continue;

                // 4. Check if drop leaves King in Check (Illegal move)
                if (isCurrentlyInCheck) {
                    board[y][x] = piece;
                    const check = isCheck(board, player);
                    board[y][x] = null;

                    if (check) continue;
                }

                drops.push({ x, y });
            }
        }
    }
    return drops;
};
