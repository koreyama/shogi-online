import { GoBoard, StoneColor, BoardSize, Point } from './goTypes';

export function createInitialBoard(size: BoardSize = 19): GoBoard {
    const grid = Array(size).fill(null).map(() => Array(size).fill(null));
    return {
        size,
        grid,
        capturedBlack: 0,
        capturedWhite: 0,
        currentColor: 'black',
        history: []
    };
}

// Get group of stones and their liberties
function getGroup(board: GoBoard, start: Point): { stones: Point[], liberties: Point[] } {
    const { size, grid } = board;
    const color = grid[start.y][start.x];
    if (!color) return { stones: [], liberties: [] };

    const stones: Point[] = [];
    const liberties: Set<string> = new Set();
    const visited: Set<string> = new Set();
    const queue: Point[] = [start];

    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const p = queue.shift()!;
        stones.push(p);

        const neighbors = [
            { x: p.x + 1, y: p.y },
            { x: p.x - 1, y: p.y },
            { x: p.x, y: p.y + 1 },
            { x: p.x, y: p.y - 1 }
        ];

        for (const n of neighbors) {
            if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
                const nKey = `${n.x},${n.y}`;
                if (!visited.has(nKey)) {
                    const nColor = grid[n.y][n.x];
                    if (nColor === color) {
                        visited.add(nKey);
                        queue.push(n);
                    } else if (nColor === null) {
                        liberties.add(nKey);
                    }
                }
            }
        }
    }

    return {
        stones,
        liberties: Array.from(liberties).map(k => {
            const [x, y] = k.split(',').map(Number);
            return { x, y };
        })
    };
}

export function isValidMove(board: GoBoard, x: number, y: number): boolean {
    if (x < 0 || x >= board.size || y < 0 || y >= board.size) return false;
    if (board.grid[y][x]) return false; // Already occupied

    // Simulate move
    const nextGrid = board.grid.map(row => [...row]);
    nextGrid[y][x] = board.currentColor;
    const mockBoard = { ...board, grid: nextGrid };

    const opponent = board.currentColor === 'black' ? 'white' : 'black';
    let capturedAny = false;

    // Check captured opponents
    const neighbors = [
        { x: x + 1, y }, { x: x - 1, y },
        { x, y: y + 1 }, { x, y: y - 1 }
    ];

    for (const n of neighbors) {
        if (n.x >= 0 && n.x < board.size && n.y >= 0 && n.y < board.size) {
            if (nextGrid[n.y][n.x] === opponent) {
                const group = getGroup(mockBoard, n);
                if (group.liberties.length === 0) {
                    capturedAny = true;
                }
            }
        }
    }

    // Check suicide
    if (!capturedAny) {
        const selfGroup = getGroup(mockBoard, { x, y });
        if (selfGroup.liberties.length === 0) return false;
    }

    // Check Ko (History)
    const boardHash = nextGrid.map(row => row.map(c => c ? c[0] : '.').join('')).join('');
    if (board.history.length > 0 && board.history[board.history.length - 1] === boardHash) {
        return false; // Ko rule violation (returning to immediate previous state)
    }

    return true;
}

export function placeStone(board: GoBoard, x: number, y: number): { success: boolean, newBoard: GoBoard | null } {
    if (!isValidMove(board, x, y)) return { success: false, newBoard: null };

    const nextBoard: GoBoard = JSON.parse(JSON.stringify(board)); // Deep copy
    nextBoard.grid[y][x] = board.currentColor;

    const opponent = board.currentColor === 'black' ? 'white' : 'black';
    let capturedPoints: Point[] = [];

    // Remove captured stones
    const neighbors = [
        { x: x + 1, y }, { x: x - 1, y },
        { x, y: y + 1 }, { x, y: y - 1 }
    ];

    for (const n of neighbors) {
        if (n.x >= 0 && n.x < board.size && n.y >= 0 && n.y < board.size) {
            if (nextBoard.grid[n.y][n.x] === opponent) {
                const group = getGroup(nextBoard, n);
                if (group.liberties.length === 0) {
                    group.stones.forEach(s => {
                        nextBoard.grid[s.y][s.x] = null;
                        capturedPoints.push(s);
                    });
                }
            }
        }
    }

    // Update Scores
    if (board.currentColor === 'black') {
        nextBoard.capturedWhite += capturedPoints.length;
    } else {
        nextBoard.capturedBlack += capturedPoints.length;
    }

    // Switch Turn
    nextBoard.currentColor = opponent;

    // Add History
    const boardHash = nextBoard.grid.map(row => row.map(c => c ? c[0] : '.').join('')).join('');
    nextBoard.history.push(boardHash);

    return { success: true, newBoard: nextBoard };
}
