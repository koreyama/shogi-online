import { GameState } from './engine';

const BOARD_SIZE = 15;
const EMPTY = 0;

// Scores for patterns
const SCORES = {
    WIN: 100000000,      // 5 in a row
    OPEN_4: 10000000,    // 4 with 2 open ends (Guaranteed Win)
    CLOSED_4: 100000,    // 4 with 1 open end (Win next turn unless blocked)
    OPEN_3: 100000,      // 3 with 2 open ends (Threat to create Open 4 -> Win)
    CLOSED_3: 1000,
    OPEN_2: 1000,
    CLOSED_2: 100,
    OPEN_1: 10,
    CLOSED_1: 1
};

// Yielder to prevent UI freeze
const shouldYield = (() => {
    let lastYield = performance.now();
    return () => {
        const now = performance.now();
        if (now - lastYield > 15) { // Yield every 15ms (60fps target)
            lastYield = now;
            return true;
        }
        return false;
    };
})();

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// --- Refactored Eval Logic ---

export async function getBestMove(state: GameState, aiColor: 'black' | 'white'): Promise<{ x: number, y: number } | null> {
    const timeLimitMs = 1000;
    const startTime = performance.now();
    const myColorCode = aiColor === 'black' ? 1 : 2;
    const oppColorCode = aiColor === 'black' ? 2 : 1;
    const board = state.board;

    let candidates = getCandidates(board, 2);
    if (candidates.length === 0) return { x: 7, y: 7 };

    // 1. TACTICAL CHECK (Determinstic Winning/Blocking)
    // Priorities:
    // 1. Win Now (5)
    // 2. Block Definite Loss (Opponent has 4)
    // 3. Create Definite Win (Open 4)
    // 4. Block Definite Loss Threat (Opponent has Open 3)

    const tacticalMove = findTacticalMove(board, candidates, myColorCode, oppColorCode);
    if (tacticalMove) {
        console.log("AI Tactical Move:", tacticalMove.type, tacticalMove.move);
        return tacticalMove.move;
    }

    // 2. Strategic Search (Minimax)
    // If no immediate win/threat, search for best position.

    const timeForSearch = timeLimitMs - (performance.now() - startTime);
    if (timeForSearch < 100) return candidates[0]; // Panic fallback

    let bestMove: { x: number, y: number } | null = candidates[0];
    let maxDepthReached = 0;

    // Sort candidates by simple heuristic to help pruning
    candidates.sort((a, b) => {
        const scoreA = evaluatePoint(board, a.x, a.y, myColorCode); // Simple 1-ply eval
        const scoreB = evaluatePoint(board, b.x, b.y, myColorCode);
        return scoreB - scoreA;
    });

    for (let depth = 2; depth <= 4; depth += 2) {
        try {
            if (performance.now() - startTime > timeLimitMs) break;
            const result = await alphaBetaRoot(board, depth, -Infinity, Infinity, myColorCode, oppColorCode, startTime, timeLimitMs);
            if (result.move) bestMove = result.move;
            maxDepthReached = depth;
        } catch (e) { break; }
    }

    console.log(`AI Finished: Depth ${maxDepthReached}, Time ${(performance.now() - startTime).toFixed(1)}ms`);
    return bestMove;
}

// Strictly priority-based finder
function findTacticalMove(board: number[], candidates: { x: number, y: number }[], myColor: number, oppColor: number): { type: string, move: { x: number, y: number } } | null {

    // 1. Check for Immediate Win (5)
    for (const move of candidates) {
        if (checkPattern(board, move.x, move.y, myColor, 5)) return { type: 'WIN', move };
    }

    // 2. Check for Emergency Block (Opponent has 4)
    // If opponent has 4, they will win next turn. MUST BLOCK.
    // If there are multiple 4s, we pick the first one (we lose anyway if multiple).
    let bestBlock: { x: number, y: number } | null = null;
    for (const move of candidates) {
        // If placing here blocks (creates 5 for opponent? No, if WE play here, it stops opponent from playing here)
        // Wait, "Block 4" means "Opponent has 4". To block, we must play on the spot that makes it 5.
        // So we check: "If Opponent plays here, do they get 5?"
        if (checkPattern(board, move.x, move.y, oppColor, 5)) {
            return { type: 'BLOCK_WIN', move };
        }
    }

    // 3. Create Unstoppable Threat (Open 4)
    // An Open 4 ( _ X X X X _ ) is a guaranteed win because opponent can block only one side.
    for (const move of candidates) {
        if (checkPattern(board, move.x, move.y, myColor, 4, true)) return { type: 'MAKE_OPEN_4', move };
    }

    // 4. Block Opponent's Unstoppable Threat (Opponent Open 3)
    // If opponent makes Open 4, we lose. So we must block spots that give them Open 4.
    // Opponent Open 3 becomes Open 4.
    // Spots to block: The ends of the Open 3.
    // Check: If Opponent plays here, do they get Open 4?
    for (const move of candidates) {
        if (checkPattern(board, move.x, move.y, oppColor, 4, true)) {
            // Prioritize this. But if there are multiple, we might be screwed.
            // Just take the first one.
            return { type: 'BLOCK_OPEN_4_THREAT', move };
        }
    }

    // 5. Create 4 (Closed 4) - Good pressure
    // Not strictly "Forced" win (can be blocked), but highly valuable.
    // We defer to Minimax for this? No, "Tactical" logic is requested.
    // Maybe better to search. But user says "Logic to place".
    // Let's rely on Minimax for general "Good moves", but strictly handle 5, Block 5, Open 4, Block Open 4.

    return null;
}

// Simplified Pattern Checker
// length: 5 for Win, 4 for Four
// isOpen: true for Open (both ends empty), false for Any
function checkPattern(board: number[], x: number, y: number, color: number, length: number, isOpen: boolean = false): boolean {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
        let count = 1;

        // Scan backward
        let backOpen = false;
        let px = x - dx; let py = y - dy;
        let backDist = 0;
        while (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE) {
            const cell = board[py * BOARD_SIZE + px];
            if (cell === color) { count++; backDist++; }
            else if (cell === EMPTY) { backOpen = true; break; }
            else break; // Blocked
            px -= dx; py -= dy;
        }

        // Scan forward
        let frontOpen = false;
        let cx = x + dx; let cy = y + dy;
        let frontDist = 0;
        while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
            const cell = board[cy * BOARD_SIZE + cx];
            if (cell === color) { count++; frontDist++; }
            else if (cell === EMPTY) { frontOpen = true; break; }
            else break; // Blocked
            cx += dx; cy += dy;
        }

        if (count >= length) {
            if (!isOpen) return true; // Just pure count check (e.g. 5 or Closed 4)
            // For Open check:
            // "Open 4" means 4 stones with BOTH ends open.
            // But be careful: "O X X X X O" is 4 stones, but "O" is opponent.
            // Our scan stops at Empty or Opponent.
            // variables `backOpen` and `frontOpen` tell us if we stopped at Empty.
            // AND we need to ensure the empty spots are actually adjacent to the strict line?
            // Our loop counts contiguous stones.
            // Example: _ X X (X) X _ 
            // We place (X). Backward finds 2 Xs then Empty. Forward finds 1 X then Empty.
            // Count = 1 + 2 + 1 = 4. backOpen=true, frontOpen=true.
            if (isOpen && backOpen && frontOpen) {
                // Double check strict open space?
                // Open 4 requires 6 spaces total: _ X X X X _
                return true;
            }
        }
    }
    return false;
}

// Keep evaluatePoint for Minimax heuristic sorting, but simplified
function evaluatePoint(board: number[], x: number, y: number, color: number): number {
    if (checkPattern(board, x, y, color, 5)) return SCORES.WIN;
    if (checkPattern(board, x, y, color, 4, true)) return SCORES.OPEN_4;
    if (checkPattern(board, x, y, color, 4, false)) return SCORES.CLOSED_4;
    if (checkPattern(board, x, y, color, 3, true)) return SCORES.OPEN_3;
    return 0;
}

// Async Alpha-Beta Root
async function alphaBetaRoot(
    board: number[],
    depth: number,
    alpha: number,
    beta: number,
    player: number,
    opponent: number,
    startTime: number,
    timeLimit: number
): Promise<{ move: { x: number, y: number } | null, score: number }> {

    const candidates = getCandidates(board, 1);
    let bestScore = -Infinity;
    let bestMove = candidates.length > 0 ? candidates[0] : null;

    for (const move of candidates) {
        // Yield check
        if (shouldYield()) await yieldToMain();
        if (performance.now() - startTime > timeLimit) throw new Error("Timeout");

        const index = move.y * BOARD_SIZE + move.x;
        board[index] = player;

        const score = - (await alphaBeta(board, depth - 1, -beta, -alpha, opponent, player, startTime, timeLimit));

        board[index] = EMPTY;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) {
            alpha = score;
        }
        if (alpha >= beta) {
            break;
        }
    }

    return { move: bestMove, score: bestScore };
}

// Async Alpha-Beta Recursive
async function alphaBeta(
    board: number[],
    depth: number,
    alpha: number,
    beta: number,
    player: number,
    opponent: number,
    startTime: number,
    timeLimit: number
): Promise<number> {
    if (depth === 0) {
        return evaluateBoard(board, player, opponent);
    }

    const candidates = getCandidates(board, 1);
    if (candidates.length === 0) return evaluateBoard(board, player, opponent);

    let bestScore = -Infinity;

    for (const move of candidates) {
        // Yield check: ensure responsiveness at all depths
        if (shouldYield()) await yieldToMain();
        if (performance.now() - startTime > timeLimit) throw new Error("Timeout");

        const index = move.y * BOARD_SIZE + move.x;
        board[index] = player;

        const score = - (await alphaBeta(board, depth - 1, -beta, -alpha, opponent, player, startTime, timeLimit));

        board[index] = EMPTY;

        if (score > bestScore) {
            bestScore = score;
        }
        if (score > alpha) {
            alpha = score;
        }
        if (alpha >= beta) {
            break;
        }
    }
    return bestScore;
}


// --- Helper Logic ---

function findForcedMove(board: number[], candidates: { x: number, y: number }[], myColor: number, oppColor: number): { x: number, y: number } | null {
    // 1. Win Immediately?
    for (const move of candidates) {
        if (evaluatePoint(board, move.x, move.y, myColor) >= SCORES.WIN) return move;
    }

    // 2. Block Immediate Loss? (Opponent has 4 or Open 3)
    let bestBlock: { x: number, y: number, score: number } | null = null;

    for (const move of candidates) {
        const threatScore = evaluatePoint(board, move.x, move.y, oppColor);
        // CLOSED_4 (100,000) or OPEN_3 (100,000) are both critical blocking needs
        if (threatScore >= SCORES.CLOSED_4) {
            if (!bestBlock || threatScore > bestBlock.score) {
                bestBlock = { x: move.x, y: move.y, score: threatScore };
            }
        }
    }
    if (bestBlock) return { x: bestBlock.x, y: bestBlock.y };

    return null;
}

function evaluateBoard(board: number[], myColor: number, oppColor: number): number {
    let myScore = 0;
    let oppScore = 0;

    // Optimized Scan: Only scan around occupied cells? 
    // For simplicity and correctness, we scan the board but skip empty fast.
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = board[y * BOARD_SIZE + x];
            if (cell === EMPTY) continue;

            const isMe = cell === myColor;
            for (const [dx, dy] of directions) {
                const score = evaluateLine(board, x, y, dx, dy, cell, true);
                if (isMe) myScore += score;
                else oppScore += score;
            }
        }
    }

    return myScore - oppScore * 1.5; // Defensive weight
}

// Evaluate a specific stone's contribution to a line
// checkDedupe: If true, ignore lines that we would have already counted (coming from previous cell)
function evaluateLine(board: number[], x: number, y: number, dx: number, dy: number, color: number, checkDedupe: boolean): number {
    if (checkDedupe) {
        const px = x - dx;
        const py = y - dy;
        if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE && board[py * BOARD_SIZE + px] === color) {
            return 0; // Already counted
        }
    }

    let count = 1;
    let openFront = false;
    let openBack = false;

    // Trace Backwards (to check open end)
    let px = x - dx;
    let py = y - dy;
    while (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE) {
        const cell = board[py * BOARD_SIZE + px];
        if (cell === color) {
            if (!checkDedupe) count++; // If not deduping, we count backward too to get total line length relative to (x,y)
            else {
                // If deduping and we found same color backward, it means we shouldn't be here?
                // Wait, checkDedupe handles the "start" of the line.
                // logic above `if (board[...] === color) return 0` handles immediate neighbor.
                // But if there's a gap? 1 0 1. 
                // Standard Gomoku evaluator usually counts contiguous blocks.
                break;
            }
        } else if (cell === EMPTY) {
            openBack = true;
            break;
        } else {
            break; // Blocked
        }
        px -= dx;
        py -= dy;
    }

    // Trace Forwards
    let cx = x + dx;
    let cy = y + dy;
    while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
        const cell = board[cy * BOARD_SIZE + cx];
        if (cell === color) {
            count++;
        } else if (cell === EMPTY) {
            openFront = true;
            break;
        } else {
            break; // Blocked
        }
        cx += dx;
        cy += dy;
    }

    if (count >= 5) return SCORES.WIN;
    if (count === 4) {
        if (openFront && openBack) return SCORES.OPEN_4;
        if (openFront || openBack) return SCORES.CLOSED_4;
    }
    if (count === 3) {
        if (openFront && openBack) return SCORES.OPEN_3;
        if (openFront || openBack) return SCORES.CLOSED_3;
    }
    if (count === 2) {
        if (openFront && openBack) return SCORES.OPEN_2;
        if (openFront || openBack) return SCORES.CLOSED_2;
    }
    return 0;
}

// Evaluate a move point by checking what lines it would Create/Extend
// Old functions removed/replaced by findTacticalMove and checkPattern logic above

function getCandidates(board: number[], dist: number): { x: number, y: number }[] {
    const candidates: { x: number, y: number }[] = [];
    const candidateSet = new Set<number>();

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y * BOARD_SIZE + x] !== EMPTY) {
                const minX = Math.max(0, x - dist);
                const maxX = Math.min(BOARD_SIZE - 1, x + dist);
                const minY = Math.max(0, y - dist);
                const maxY = Math.min(BOARD_SIZE - 1, y + dist);

                for (let cy = minY; cy <= maxY; cy++) {
                    for (let cx = minX; cx <= maxX; cx++) {
                        const cIndex = cy * BOARD_SIZE + cx;
                        if (board[cIndex] === EMPTY && !candidateSet.has(cIndex)) {
                            candidateSet.add(cIndex);
                            candidates.push({ x: cx, y: cy });
                        }
                    }
                }
            }
        }
    }
    return candidates;
}
