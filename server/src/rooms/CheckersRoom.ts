import { Room, Client } from "colyseus";
import { CheckersState, CheckersPlayer, CheckersPiece } from "./schema/CheckersState";

const ROWS = 10;
const COLS = 10;

export class CheckersRoom extends Room<CheckersState> {
    maxClients = 2;

    onCreate(options: any) {
        this.setState(new CheckersState());

        // 6-digit numeric ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.initBoard();

        this.onMessage("chat", (client, message: any) => {
            this.broadcast("chat", message);
        });

        this.onMessage("move", (client, message: any) => {
            if (!this.state.gameStarted || this.state.winner !== "") return;

            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;

            const moveAction = message; // { from: {r,c}, to: {r,c}, isJump, jumpedPiece: {r,c} }

            // Validate and execute move
            this.handleMove(client, moveAction);
        });
    }

    initBoard() {
        // Black (Top) - Rows 0, 1, 2, 3
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < COLS; c++) {
                if ((r + c) % 2 === 1) {
                    const piece = new CheckersPiece();
                    piece.type = 'man';
                    piece.owner = 'black';
                    this.state.board.set(`${r},${c}`, piece);
                }
            }
        }

        // Red (Bottom) - Rows 6, 7, 8, 9
        for (let r = 6; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if ((r + c) % 2 === 1) {
                    const piece = new CheckersPiece();
                    piece.type = 'man';
                    piece.owner = 'red';
                    this.state.board.set(`${r},${c}`, piece);
                }
            }
        }
    }

    onJoin(client: Client, options: any) {
        const count = this.clients.length;
        const role = count === 1 ? "red" : "black";

        const player = new CheckersPlayer();
        player.id = client.sessionId;
        player.name = options.name || "Player";
        player.role = role;
        this.state.players.set(client.sessionId, player);

        if (count === 2) {
            this.state.gameStarted = true;
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
        this.unlock();
    }

    handleMove(client: Client, moveAction: any) {
        const { from, to, isJump, jumpedPiece } = moveAction;
        const playerRole = this.state.turn;
        const opponentRole = playerRole === 'red' ? 'black' : 'red';

        const piece = this.state.board.get(`${from.r},${from.c}`);
        if (!piece) return;

        // Apply move
        this.state.board.set(`${to.r},${to.c}`, piece);
        this.state.board.delete(`${from.r},${from.c}`);

        if (isJump && jumpedPiece) {
            this.state.board.delete(`${jumpedPiece.r},${jumpedPiece.c}`);
        }

        // Promotion
        let promoted = false;
        if (piece.type === 'man') {
            if ((playerRole === 'red' && to.r === 0) || (playerRole === 'black' && to.r === ROWS - 1)) {
                piece.type = 'king';
                promoted = true;
            }
        }

        // Multi-jump check
        let multiJumpAvailable = false;
        if (isJump && !promoted) {
            const furtherJumps = this.getJumps(to.r, to.c, playerRole);
            if (furtherJumps.length > 0) {
                multiJumpAvailable = true;
            }
        }

        if (multiJumpAvailable) {
            this.state.activePiece = JSON.stringify({ r: to.r, c: to.c });
            this.state.mustJump = true;
            // Turn stays
        } else {
            this.state.activePiece = "";
            this.state.mustJump = false;
            this.state.turn = opponentRole;
        }

        // Check Win Condition
        if (!this.hasLegalMoves(this.state.turn)) {
            this.state.winner = playerRole;
        }
    }

    getJumps(r: number, c: number, player: string): any[] {
        const jumps: any[] = [];
        const piece = this.state.board.get(`${r},${c}`);
        if (!piece) return [];

        const directions = this.getDirections(piece.type, player);

        for (const [dr, dc] of directions) {
            const midR = r + dr;
            const midC = c + dc;
            const toR = r + dr * 2;
            const toC = c + dc * 2;

            if (this.isValidPos(toR, toC)) {
                const midPiece = this.state.board.get(`${midR},${midC}`);
                const target = this.state.board.get(`${toR},${toC}`);

                if (midPiece && midPiece.owner !== player && !target) {
                    jumps.push({
                        from: { r, c },
                        to: { r: toR, c: toC },
                        isJump: true,
                        jumpedPiece: { r: midR, c: midC }
                    });
                }
            }
        }
        return jumps;
    }

    getDirections(type: string, owner: string): number[][] {
        const forward = owner === 'red' ? -1 : 1;
        if (type === 'king') {
            return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        }
        return [[forward, -1], [forward, 1]];
    }

    isValidPos(r: number, c: number) {
        return r >= 0 && r < ROWS && c >= 0 && c < COLS;
    }

    hasLegalMoves(player: string): boolean {
        // If mandatory jump exists, player must have at least one jump
        const jumps: any[] = [];
        const moves: any[] = [];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = this.state.board.get(`${r},${c}`);
                if (piece && piece.owner === player) {
                    jumps.push(...this.getJumps(r, c, player));
                    if (jumps.length === 0) {
                        moves.push(...this.getSimpleMoves(r, c, player));
                    }
                }
            }
        }
        return jumps.length > 0 || moves.length > 0;
    }

    getSimpleMoves(r: number, c: number, player: string): any[] {
        const moves: any[] = [];
        const piece = this.state.board.get(`${r},${c}`);
        if (!piece) return [];

        const directions = this.getDirections(piece.type, player);

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (this.isValidPos(nr, nc) && !this.state.board.has(`${nr},${nc}`)) {
                moves.push({
                    from: { r, c },
                    to: { r: nr, c: nc },
                    isJump: false
                });
            }
        }
        return moves;
    }
}
