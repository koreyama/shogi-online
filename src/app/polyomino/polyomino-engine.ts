import { Board, GameState, Piece, PlacedPiece, PlayerColor, Point, BOARD_SIZE } from './polyomino-types';
import { INITIAL_PIECES } from './polyomino-data';

export class PolyominoEngine {
    private state: GameState;

    constructor() {
        this.state = this.createInitialState();
    }

    public getState(): GameState {
        return this.state;
    }

    public createInitialState(): GameState {
        // Create 14x14 empty board
        const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

        return {
            board,
            currentPlayer: 'P1',
            projectedScore: { P1: 0, P2: 0 },
            hands: {
                P1: [...INITIAL_PIECES],
                P2: [...INITIAL_PIECES],
            },
            isGameOver: false,
            turnCount: 0
        };
    }

    public isValidMove(pieceShape: number[][], position: Point, player: PlayerColor): boolean {
        // 1. Check Bounds & Collision (Blocks must land on empty cells)
        for (let r = 0; r < pieceShape.length; r++) {
            for (let c = 0; c < pieceShape[r].length; c++) {
                if (pieceShape[r][c] === 1) {
                    const boardR = position.y + r;
                    const boardC = position.x + c;

                    // Out of bounds
                    if (boardR < 0 || boardR >= BOARD_SIZE || boardC < 0 || boardC >= BOARD_SIZE) {
                        return false;
                    }

                    // Collision with existing block
                    if (this.state.board[boardR][boardC] !== null) {
                        return false;
                    }
                }
            }
        }

        // 2. Check Adjacency Rule (Must NOT touch own color orthogonally)
        // 3. Check Corner Rule (Must touch own color diagonally) OR Start Position
        let touchesCorner = false;
        let isFirstMove = true;

        // Check if player has placed any pieces yet
        // Optimization: checking hands length is risky if we have varying pieces. 
        // Better: Scan board? Or track flag.
        // We rely on board state scanning for reliability:

        // Correct check relies on board state scanning for reliability:
        const hasExistingPieces = this.hasPlacedPieces(player);
        if (hasExistingPieces) isFirstMove = false;


        for (let r = 0; r < pieceShape.length; r++) {
            for (let c = 0; c < pieceShape[r].length; c++) {
                if (pieceShape[r][c] === 1) {
                    const boardR = position.y + r;
                    const boardC = position.x + c;

                    // Orthogonal Checks (Up, Down, Left, Right) - MUST be Empty or Other Color
                    const ortho = [
                        { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
                    ];

                    for (const o of ortho) {
                        const nR = boardR + o.r;
                        const nC = boardC + o.c;
                        if (nR >= 0 && nR < BOARD_SIZE && nC >= 0 && nC < BOARD_SIZE) {
                            if (this.state.board[nR][nC] === player) {
                                return false; // Edge touches own color -> Invalid
                            }
                        }
                    }

                    // Diagonal Checks (Valid Connection)
                    const diag = [
                        { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
                    ];

                    for (const d of diag) {
                        const nR = boardR + d.r;
                        const nC = boardC + d.c;
                        if (nR >= 0 && nR < BOARD_SIZE && nC >= 0 && nC < BOARD_SIZE) {
                            if (this.state.board[nR][nC] === player) {
                                touchesCorner = true;
                            }
                        }
                    }

                    // Start Position Checks
                    if (isFirstMove) {
                        // P1 Start: Top Left (4,4) - Adjusted for standard Blokus Duo start points usually
                        // Standard Blokus Duo starts at (4,4) and (9,9) usually on 14x14 grid.
                        // Let's use (4,4) and (9,9).
                        if (player === 'P1' && boardR === 4 && boardC === 4) touchesCorner = true;
                        if (player === 'P2' && boardR === 9 && boardC === 9) touchesCorner = true;
                    }
                }
            }
        }

        return touchesCorner;
    }

    private hasPlacedPieces(player: PlayerColor): boolean {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.state.board[r][c] === player) return true;
            }
        }
        return false;
    }

    public placePiece(pieceId: string, shape: number[][], position: Point): boolean {
        const player = this.state.currentPlayer;
        const hand = this.state.hands[player];
        const pieceIndex = hand.findIndex(p => p.id === pieceId);

        if (pieceIndex === -1) return false; // Piece not in hand

        if (!this.isValidMove(shape, position, player)) return false;

        // Apply Move
        const newBoard = this.state.board.map(row => [...row]);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    newBoard[position.y + r][position.x + c] = player;
                }
            }
        }

        // Remove from hand
        const newHand = [...hand];
        const usedPiece = newHand.splice(pieceIndex, 1)[0];

        // Update Score (Placed blocks count)
        const scoreToAdd = usedPiece.value;

        this.state = {
            ...this.state,
            board: newBoard,
            hands: {
                ...this.state.hands,
                [player]: newHand
            },
            projectedScore: {
                ...this.state.projectedScore,
                [player]: this.state.projectedScore[player] + scoreToAdd
            },
            currentPlayer: player, // Will be updated by checkTurnLogic
            turnCount: this.state.turnCount + 1,
            lastPlaced: { pieceId, player, position, shape }
        };

        this.checkTurnLogic();

        return true;
    }

    private checkTurnLogic() {
        // Logic:
        // 1. Switch to Next Player
        // 2. Check if Next Player has Moves.
        //    YES -> Set Current = Next. Return.
        //    NO  -> Next Player Pass.
        // 3. Check if Current Player (Initial) has Moves.
        //    YES -> Set Current = Current (Play Again). Status: "Opponent Passed!"
        //    NO  -> Game Over (Both can't move).

        const current = this.state.currentPlayer;
        const next = current === 'P1' ? 'P2' : 'P1';

        // Check Next Player
        if (this.canPlayerMove(next)) {
            this.state.currentPlayer = next;
            this.state.statusMessage = undefined;
            return;
        }

        // Next Player CANNOT move. Check Current Player.
        if (this.canPlayerMove(current)) {
            // Keep turn, show message
            this.state.currentPlayer = current;
            this.state.statusMessage = `${next} Cannot Move! ${current} plays again.`;
            return;
        }

        // Neither can move -> Game Over
        this.state.isGameOver = true;
        this.state.statusMessage = "Game Over! No more moves possible.";
        this.finishGame();
    }

    private finishGame() {
        const p1Score = this.state.projectedScore.P1;
        const p2Score = this.state.projectedScore.P2;
        let result = "";
        if (p1Score > p2Score) result = "Player 1 Wins!";
        else if (p2Score > p1Score) result = "Player 2 Wins!";
        else result = "Draw!";
        this.state.statusMessage = `Game Over. ${result}`;
    }

    public canPlayerMove(player: PlayerColor): boolean {
        // Re-use logic from calculateBestMove but exit early
        // Or essentially "calculateBestMove" != null
        return this.calculateBestMove(player) !== null;
    }

    // Helper: Rotate Matrix 90 deg clockwise
    public static rotate(matrix: number[][]): number[][] {
        const N = matrix.length;
        const M = matrix[0].length;
        const ret = Array.from({ length: M }, () => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < M; c++) {
                ret[c][N - 1 - r] = matrix[r][c];
            }
        }
        return ret;
    }

    // AI Logic
    public calculateBestMove(player: PlayerColor): { pieceId: string, shape: number[][], position: Point } | null {
        const hand = this.state.hands[player];
        let bestMove = null;
        let maxScore = -1;

        // Shuffle hand to add variety
        const shuffledHand = [...hand].sort(() => Math.random() - 0.5);

        for (const piece of shuffledHand) {
            // Optimize: Try simpler shapes first? Or just all.
            // Generate all unique variations (rotations/flips)
            const variations = this.getUniqueVariations(piece.shape);

            for (const shape of variations) {
                // Try reasonable positions
                // Optimization: Only scan cells near existing pieces or start points?
                // Scanning 14x14 for every piece/rotation is heavy but manageable (21 pieces * 8 vars * 196 cells = 33k checks worst case).
                // Let's do full scan for simplicity, it should be instant in JS.

                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        const pos = { x: c, y: r };
                        if (this.isValidMove(shape, pos, player)) {
                            // Simple Heuristic: Maximize piece size
                            // Better Heuristic? Distance to center? Touching opponent?
                            // For "Simple AI", just playing largest pieces first is good.
                            const score = piece.value + (Math.random() * 0.5); // Add jitter to break ties

                            if (score > maxScore) {
                                maxScore = score;
                                bestMove = { pieceId: piece.id, shape, position: pos };
                            }
                        }
                    }
                }
            }
            // Optimization: If found a valid move for a high-value piece (5), take it early? 
            // Strict greedy might be too predictable.
        }

        return bestMove;
    }

    private getUniqueVariations(baseShape: number[][]): number[][][] {
        const variations: number[][][] = [];
        const seen = new Set<string>();

        let current = baseShape;
        for (let i = 0; i < 4; i++) {
            // Standard
            this.addVariation(current, variations, seen);
            // Flipped
            this.addVariation(PolyominoEngine.flip(current), variations, seen);

            current = PolyominoEngine.rotate(current);
        }
        return variations;
    }

    private addVariation(shape: number[][], list: number[][][], seen: Set<string>) {
        const str = JSON.stringify(shape);
        if (!seen.has(str)) {
            seen.add(str);
            list.push(shape);
        }
    }

    // Helper: Flip Horizontal
    public static flip(matrix: number[][]): number[][] {
        return matrix.map(row => [...row].reverse());
    }
}
