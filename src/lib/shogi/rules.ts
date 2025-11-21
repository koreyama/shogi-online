import { Piece, Position, Player, BoardState, Coordinates } from './types';

// Helper to check if position is on board
const isValidPos = (x: number, y: number): boolean => {
    return x >= 0 && x < 9 && y >= 0 && y < 9;
};

// Helper to check if a cell is occupied by own piece
const isOwnPiece = (board: BoardState, x: number, y: number, player: Player): boolean => {
    const cell = board[y][x];
    return cell !== null && cell.owner === player;
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
