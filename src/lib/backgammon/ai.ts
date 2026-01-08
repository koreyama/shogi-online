import { GameState, Move, getAllLegalMoves, applyMove, hasPossibleMoves } from './engine';

export function getBestMoveSequence(state: GameState): Move[] {
    // AI Strategy:
    // We need to play ALL available dice if possible.
    // This function returns a SEQUENCE of moves.
    // Since state updates after each move, we simulate depth-first.

    // Limit recursion for performance (max depth 4 for doubles).

    // We want to maximize a heuristic score.
    // Score = (Pip Count Difference) + (Hit Bonus) + (Safety Bonus)

    // Simplified Greedy:
    // Just find one best move, apply, then find next best.
    // Problem: Might choose a move that blocks the second die.
    // Better: Search full sequence tree.

    const sequences = findAllMoveSequences(state);
    if (sequences.length === 0) return [];

    // Evaluate end states
    let bestSeq: Move[] = [];
    let bestScore = -Infinity;

    for (const seq of sequences) {
        // Simulate to end
        let currentState = state;
        for (const mv of seq) {
            currentState = applyMove(currentState, mv);
        }

        const score = evaluateState(currentState, state.turn);
        if (score > bestScore) {
            bestScore = score;
            bestSeq = seq;
        }
    }

    return bestSeq;
}

function findAllMoveSequences(state: GameState): Move[][] {
    // Returns list of [Move, Move... ]
    // Recursive
    const moves = getAllLegalMoves(state);
    if (moves.length === 0) return []; // No moves at this leaf

    // Optimizing: If we have dice [6, 1], we can play 6 then 1, OR 1 then 6.
    // We should explore both unless they lead to same state.

    const completedSequences: Move[][] = [];

    for (const mv of moves) {
        const nextState = applyMove(state, mv);

        // Recurse if more dice
        if (nextState.dice.length > 0) {
            const subSequences = findAllMoveSequences(nextState);
            if (subSequences.length === 0) {
                // End of line for this branch
                completedSequences.push([mv]);
            } else {
                for (const sub of subSequences) {
                    completedSequences.push([mv, ...sub]);
                }
            }
        } else {
            completedSequences.push([mv]);
        }
    }

    // Filter for "Max Dice Usage" rule
    // If you can play 2 moves, you cannot play just 1.
    if (completedSequences.length === 0) return [];

    const maxLen = Math.max(...completedSequences.map(s => s.length));
    const validSeqs = completedSequences.filter(s => s.length === maxLen);

    // Backgammon rule: if you can play one or the other but not both, must play higher die.
    // Complex to implement strictly here. Let's assume max length is sufficient for now.

    return validSeqs;
}

function evaluateState(state: GameState, myColor: number): number {
    if (state.winner) {
        return state.winner === (myColor === 1 ? "White" : "Black") ? 10000 : -10000;
    }

    let score = 0;
    const oppColor = myColor === 1 ? 2 : 1;

    // 1. Pip Count (Total distance to minimize)
    // My Pips (Lower is better)
    // Opp Pips (Higher is better)

    const myPips = calculatePipCount(state, myColor);
    const oppPips = calculatePipCount(state, oppColor);

    score += (oppPips - myPips);

    // 2. Safety / Blots (Single pieces are bad)
    const myBlots = countBlots(state, myColor);
    score -= myBlots * 5; // Penalty for having blots

    const oppBlots = countBlots(state, oppColor);
    score += oppBlots * 3; // Bonus for opponent blots (opportunities)

    // 3. Anchors (Secured points)
    const myPoints = countSecurePoints(state, myColor);
    score += myPoints * 2;

    // 4. Hit (Opponent on bar is good)
    const oppBar = oppColor === 1 ? state.bar.white : state.bar.black;
    score += oppBar * 10;

    const myBar = myColor === 1 ? state.bar.white : state.bar.black;
    score -= myBar * 15; // Very bad to be on bar

    return score;
}

function calculatePipCount(state: GameState, color: number): number {
    let pips = 0;
    // White (1): Moves 24->1. Dist is index+1. 
    // Wait, indices 23->0. 
    // Board[23] is "24 point". Dist is 24.
    // Board[0] is "1 point". Dist is 1.
    // So for White, pip = (index + 1) * count.

    // Black (2): Moves 1->24.
    // Board[0] is opponent's 24 point (distance 24).
    // Board[23] is opponent's 1 point (distance 1).
    // Pip = (24 - index) * count.

    if (color === 1) { // White
        for (let i = 0; i < 24; i++) {
            if (state.board[i].color === 1) {
                pips += (i + 1) * state.board[i].count;
            }
        }
        pips += state.bar.white * 25; // Bar is far away
    } else { // Black
        for (let i = 0; i < 24; i++) {
            if (state.board[i].color === 2) {
                pips += (24 - i) * state.board[i].count;
            }
        }
        pips += state.bar.black * 25;
    }
    return pips;
}

function countBlots(state: GameState, color: number): number {
    let blots = 0;
    for (let i = 0; i < 24; i++) {
        if (state.board[i].color === color && state.board[i].count === 1) {
            // Unprotected!
            blots++;
        }
    }
    return blots;
}

function countSecurePoints(state: GameState, color: number): number {
    let points = 0;
    for (let i = 0; i < 24; i++) {
        if (state.board[i].color === color && state.board[i].count >= 2) {
            points++;
        }
    }
    return points;
}
