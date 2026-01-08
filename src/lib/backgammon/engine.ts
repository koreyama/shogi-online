export type PlayerColor = 1 | 2; // 1: White, 2: Black

export interface Point {
    count: number;
    color: number; // 0: None, 1: White, 2: Black
}

export interface GameState {
    board: Point[];
    bar: { white: number; black: number };
    off: { white: number; black: number };
    dice: number[];
    turn: PlayerColor;
    winner: string | null;
}

export const BOARD_POINTS = 24;

export function getInitialState(): GameState {
    const board: Point[] = Array(24).fill(null).map(() => ({ count: 0, color: 0 }));

    // Standard Setup
    // Black moves 1 -> 24 (Home: 19-24)??
    // Standard notation:
    // White Home: 1-6. Black Home: 19-24.
    // White moves 24 -> 1. Black moves 1 -> 24.

    // Let's stick to the visual layout observed in `BackgammonBoard.tsx`:
    // It says: "White moves Anti-CW (24->1)", "Black moves CW (1->24)".

    // Setup for White (Moving towards 0)
    // 2 on 24
    board[23] = { count: 2, color: 1 };
    // 5 on 13
    board[12] = { count: 5, color: 1 };
    // 3 on 8
    board[7] = { count: 3, color: 1 };
    // 5 on 6
    board[5] = { count: 5, color: 1 };

    // Setup for Black (Moving towards 24)
    // 2 on 1
    board[0] = { count: 2, color: 2 };
    // 5 on 12
    board[11] = { count: 5, color: 2 };
    // 3 on 17
    board[16] = { count: 3, color: 2 };
    // 5 on 19
    board[18] = { count: 5, color: 2 };

    return {
        board,
        bar: { white: 0, black: 0 },
        off: { white: 0, black: 0 },
        dice: [],
        turn: 1, // White starts (usually decided by roll, but simplified)
        winner: null,
    };
}

export function rollDice(): number[] {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    if (d1 === d2) return [d1, d1, d1, d1];
    return [d1, d2];
}

// Direction for moving "forward"
// White (1): 23 -> 0. Direction: -1.
// Black (2): 0 -> 23. Direction: +1.
export function getDirection(color: PlayerColor): number {
    return color === 1 ? -1 : 1;
}

export function canBearOff(state: GameState, color: PlayerColor): boolean {
    // Check if all pieces are in home board
    // White Home: 0-5. (Indices 0-5)
    // Black Home: 18-23. (Indices 18-23)

    if (color === 1) {
        if (state.bar.white > 0) return false;
        for (let i = 6; i < 24; i++) {
            if (state.board[i].color === 1 && state.board[i].count > 0) return false;
        }
    } else {
        if (state.bar.black > 0) return false;
        for (let i = 0; i < 18; i++) {
            if (state.board[i].color === 2 && state.board[i].count > 0) return false;
        }
    }
    return true;
}

export interface Move {
    from: number | "bar";
    to: number | "off";
    dieValue: number; // needed to know which die was used
}

// Validate a specific single move attempt
export function isValidMove(state: GameState, from: number | "bar", to: number | "off", die: number): boolean {
    const color = state.turn;
    const direction = getDirection(color);

    // 1. From Bar Logic
    if (from === "bar") {
        if (color === 1) {
            if (state.bar.white === 0) return false;
            // White enters at 24 (index 23) -> 19 (index 18)??
            // White moves 24 -> 1.
            // Entering with die X means landing on 24 - X + 1? Or just index 24-X?
            // "White moves 24 -> 1". Top Left is 12..17. Top Right is 18..23.
            // 24 is "off board" start?
            // Index 23 is "24 point".
            // Enter with 1 -> Index 23.
            // Enter with 6 -> Index 18.
            const target = 24 - die;
            if (to !== target) return false;
        } else {
            if (state.bar.black === 0) return false;
            // Black moves 1 -> 24.
            // Enter with 1 -> Index 0.
            // Enter with 6 -> Index 5.
            const target = die - 1;
            if (to !== target) return false;
        }

        // Check destination blocked
        // 'to' is guaranteed to be number here
        const toIdx = to as number;
        const dest = state.board[toIdx];
        if (dest.color !== 0 && dest.color !== color && dest.count > 1) return false;

        return true;
    }

    // 2. Normal Move Logic
    if (typeof from !== "number") return false; // Should be handled by bar check

    const source = state.board[from];
    if (source.color !== color || source.count === 0) return false;

    // Must use die exactly
    if (to === "off") {
        if (!canBearOff(state, color)) return false;

        // Exact carry off?
        // White (23->0): from - die == -1 (virtual 0-1 = -1?)
        // Let's say board 0..23.
        // Bear off destination is effectively -1 (White) or 24 (Black).

        let targetVal = -1;
        if (color === 1) targetVal = -1;
        else targetVal = 24;

        // Exact match
        const dist = color === 1 ? (from - (-1)) : (24 - from);
        // White: form=0, die=1 => 0 - (-1) = 1. OK.

        if (color === 1) {
            // White bearing off.
            // Exact roll?
            if (from + 1 === die) return true;
            // If die is larger than distance, permitted ONLY if no pieces on higher points
            if (die > from + 1) {
                // Check indices > from (up to 5)
                for (let i = from + 1; i <= 5; i++) {
                    if (state.board[i].color === 1 && state.board[i].count > 0) return false;
                }
                return true;
            }
            return false;
        } else {
            // Black bearing off (18..23 -> 24)
            // Exact roll?
            // from=23, die=1 => 24-23=1. OK.
            if (24 - from === die) return true;
            if (die > 24 - from) {
                // Check indices < from (down to 18)
                for (let i = from - 1; i >= 18; i--) {
                    if (state.board[i].color === 2 && state.board[i].count > 0) return false;
                }
                return true;
            }
            return false;
        }
    }

    // Normal to Normal
    if (typeof to !== "number") return false;

    // Validate distance
    const diff = to - from;
    if (color === 1) {
        // -direction (decreasing index)
        if (diff !== -die) return false;
    } else {
        // +direction (increasing index)
        if (diff !== die) return false;
    }

    // Check Destination
    const dest = state.board[to];
    // Blocked?
    if (dest.color !== 0 && dest.color !== color && dest.count > 1) return false;

    return true;
}

export function getAllLegalMoves(state: GameState): Move[] {
    // Return all possible single moves for the current dice
    // But Backgammon moves are sequences.
    // For AI, we typically need "Full Turn" validation, but simplify to "Next Step".
    // Actually, local engine usually updates state step-by-step.

    // Simply iterate valid moves for unique die values available
    const moves: Move[] = [];
    const color = state.turn;
    const uniqueDice = Array.from(new Set(state.dice)); // Don't duplicate for 5,5 (just try 5 once)

    for (const die of uniqueDice) {
        // 1. Bar Moves?
        if ((color === 1 && state.bar.white > 0) || (color === 2 && state.bar.black > 0)) {
            // MUST move from bar
            // Calc destination
            let target = -1;
            if (color === 1) target = 24 - die;
            else target = die - 1;

            if (isValidMove(state, "bar", target, die)) {
                moves.push({ from: "bar", to: target, dieValue: die });
            }
            // If cannot move from bar, others are invalid anyway for this die.
            continue;
        }

        // 2. Normal Moves
        // Iterate all points
        for (let i = 0; i < 24; i++) {
            if (state.board[i].color === color && state.board[i].count > 0) {
                // Try Normal Destination
                let target = i + (color === 1 ? -die : die);
                // Check board bounds
                if (target >= 0 && target < 24) {
                    if (isValidMove(state, i, target, die)) {
                        moves.push({ from: i, to: target, dieValue: die });
                    }
                }

                // Try Bear Off
                if (isValidMove(state, i, "off", die)) {
                    moves.push({ from: i, to: "off", dieValue: die });
                }
            }
        }
    }
    return moves;
}

export function applyMove(originalState: GameState, move: Move): GameState {
    const state = JSON.parse(JSON.stringify(originalState)); // Deep copy relatively cheap here
    const color = state.turn;

    // Remove Die
    const dieIdx = state.dice.indexOf(move.dieValue);
    if (dieIdx > -1) state.dice.splice(dieIdx, 1);
    else console.error("Trying to use die not in list");

    // Remove Source
    if (move.from === "bar") {
        if (color === 1) state.bar.white--;
        else state.bar.black--;
    } else {
        state.board[move.from].count--;
        if (state.board[move.from].count === 0) state.board[move.from].color = 0;
    }

    // Add Destination
    if (move.to === "off") {
        if (color === 1) state.off.white++;
        else state.off.black++;
    } else {
        const dest = state.board[move.to];
        // HIT Logic
        if (dest.color !== 0 && dest.color !== color && dest.count === 1) {
            // Hit!
            if (color === 1) {
                // Hit Black
                state.bar.black++;  // Black to bar
            } else {
                // Hit White
                state.bar.white++;
            }
            dest.count = 1;
            dest.color = color;
        } else {
            // Normal Land
            dest.color = color;
            dest.count++;
        }
    }

    // Check Win
    if (state.off.white === 15) state.winner = "White";
    if (state.off.black === 15) state.winner = "Black";

    return state;
}

export function hasPossibleMoves(state: GameState): boolean {
    // Quick check if any move is possible with any die
    // Note: This is simplified. Strict rules say "if you can play both dice, you must".
    // "If you can only play one, you must play higher".
    // We will enforce this in AI but maybe relax for simple local UI (allow any legal move).
    // For "Pass" detection, we need to know if 0 moves exist.
    const moves = getAllLegalMoves(state);
    return moves.length > 0;
}
