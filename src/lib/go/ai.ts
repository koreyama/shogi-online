import { GoBoard, StoneColor } from './types';
import { placeStone, getGroup, isValidMove } from './engine';

export function getBestMove(board: GoBoard, color: StoneColor): { x: number, y: number } | 'pass' {
    const size = board.size;
    let bestScore = -Infinity;
    let candidates: { x: number, y: number }[] = [];

    // Heuristics Weights
    const W_CAPTURE = 1000;
    const W_ATARI = 100;
    const W_SAVE = 500;
    const W_SELF_ATARI = -200;
    const W_LIBERTIES = 5;
    const W_EDGE = -50;
    const W_2ND_LINE = -10;
    const W_PROXIMITY = 10;
    const W_TENGEN = 5; // Center bonus

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // 1. Validity Check
            if (board.grid[y][x] !== null) continue;
            if (!isValidMove(board, x, y)) continue;

            let score = Math.random() * 5; // Base random score

            // 2. Positional Heuristics
            const minX = Math.min(x, size - 1 - x);
            const minY = Math.min(y, size - 1 - y);
            const line = Math.min(minX, minY); // 0-indexed distance from edge

            if (line === 0) score += W_EDGE;
            else if (line === 1) score += W_2ND_LINE;
            else if (line >= 2 && line <= 4) score += 10; // 3rd/4th line preference

            // Center (Tengen) bias for early game
            if (board.history.length < 10) {
                const distCenter = Math.abs(x - size / 2 + 0.5) + Math.abs(y - size / 2 + 0.5);
                if (distCenter < 4) score += W_TENGEN;
            }

            // Proximity to other stones
            let nearStones = false;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                        if (board.grid[ny][nx] !== null) {
                            nearStones = true;
                            // Add extra if touching opponent (fighting)
                            if (board.grid[ny][nx] !== color) score += 2;
                        }
                    }
                }
            }
            if (nearStones) score += W_PROXIMITY;

            // 3. Simulation
            const result = placeStone(board, x, y);
            if (!result.success || !result.newBoard) continue;
            const nextBoard = result.newBoard;

            // A. Capture Check
            const captured = (color === 'black')
                ? (nextBoard.capturedWhite - board.capturedWhite)
                : (nextBoard.capturedBlack - board.capturedBlack);

            if (captured > 0) {
                // High bonus for capturing
                score += captured * W_CAPTURE;
            }

            // B. Atari Check (Offensive) - Does this move threaten opponent group?
            const opponent = color === 'black' ? 'white' : 'black';
            const neighbors = [
                { x: x + 1, y }, { x: x - 1, y },
                { x, y: y + 1 }, { x, y: y - 1 }
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
                    if (nextBoard.grid[n.y][n.x] === opponent) {
                        const group = getGroup(nextBoard, n);
                        if (group.liberties.length === 1) {
                            score += W_ATARI;
                        }
                    }
                }
            }

            // C. Self Group Status (Defensive)
            const myGroup = getGroup(nextBoard, { x, y });

            // Self-Atari (Bad unless capturing)
            if (myGroup.liberties.length === 1) {
                if (captured === 0) {
                    score += W_SELF_ATARI;
                }
            }

            // Prefer more liberties
            score += myGroup.liberties.length * W_LIBERTIES;

            // D. Save Bonus (Did we escape Atari?)
            // Check neighbors on ORIGINAL board. If any was my color and had 1 liberty.
            let savedAtaris = 0;
            for (const n of neighbors) {
                if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
                    if (board.grid[n.y][n.x] === color) {
                        const originalGroup = getGroup(board, n);
                        if (originalGroup.liberties.length === 1) {
                            // This move connects to a group in Atari.
                            // If new group has > 1 liberties, we saved it!
                            if (myGroup.liberties.length > 1) {
                                savedAtaris += originalGroup.stones.length;
                            }
                        }
                    }
                }
            }
            if (savedAtaris > 0) {
                score += savedAtaris * W_SAVE;
            }

            // Update Best
            if (score > bestScore) {
                bestScore = score;
                candidates = [{ x, y }];
            } else if (Math.abs(score - bestScore) < 0.01) {
                candidates.push({ x, y });
            }
        }
    }

    if (candidates.length === 0) return 'pass';

    // Pick random from best candidates
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    return choice;
}
