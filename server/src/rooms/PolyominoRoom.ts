import { Room, Client } from "colyseus";
import { PolyominoState, PolyominoPlayer, PolyominoPiece } from "./schema/PolyominoState";

const BOARD_SIZE = 14;

export class PolyominoRoom extends Room<PolyominoState> {
    onCreate(options: any) {
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setState(new PolyominoState());
        this.maxClients = 2;

        if (options.isPrivate) {
            this.setPrivate();
        }

        this.onMessage("place", (client, message) => {
            this.handlePlace(client, message);
        });

        this.onMessage("chat", (client, message) => {
            this.broadcast("chat", {
                id: message.id,
                sender: message.sender,
                text: message.text,
                timestamp: message.timestamp
            });
        });

        this.onMessage("pass", (client) => {
            if (!this.state.gameStarted || this.state.isGameOver) return;
            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;

            player.hasNoMoves = true;
            this.state.turn = this.state.turn === "P1" ? "P2" : "P1";
            this.checkGameOver();
        });
    }

    onJoin(client: Client, options: any) {
        const player = new PolyominoPlayer();
        player.id = client.sessionId;
        player.name = options.name || "Anonymous";

        const playerIds = Array.from(this.state.players.keys());
        if (playerIds.length === 0) {
            player.role = "P1";
        } else {
            const existingRole = this.state.players.get(playerIds[0]).role;
            player.role = existingRole === "P1" ? "P2" : "P1";
        }

        // Initialize hand - pieces defined by ID and value
        // Standard Duo set IDs from client polyomino-data.ts
        const pieceData = [
            { id: '1-1', val: 1 }, { id: '2-1', val: 2 },
            { id: '3-1', val: 3 }, { id: '3-2', val: 3 },
            { id: '4-1', val: 4 }, { id: '4-2', val: 4 }, { id: '4-3', val: 4 }, { id: '4-4', val: 4 }, { id: '4-5', val: 4 },
            { id: '5-1', val: 5 }, { id: '5-2', val: 5 }, { id: '5-3', val: 5 }, { id: '5-4', val: 5 }, { id: '5-5', val: 5 },
            { id: '5-6', val: 5 }, { id: '5-7', val: 5 }, { id: '5-8', val: 5 }, { id: '5-9', val: 5 }, { id: '5-10', val: 5 },
            { id: '5-11', val: 5 }, { id: '5-12', val: 5 }
        ];

        pieceData.forEach(d => {
            const p = new PolyominoPiece();
            p.id = d.id;
            p.value = d.val;
            player.hand.push(p);
        });

        this.state.players.set(client.sessionId, player);

        if (this.state.players.size === 2) {
            this.state.gameStarted = true;
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        this.broadcast("chat", {
            id: `sys-${Date.now()}`,
            sender: "System",
            text: `${player?.name || "Someone"} left the room.`,
            timestamp: Date.now()
        });

        if (this.state.gameStarted && !this.state.isGameOver) {
            this.state.winner = player?.role === "P1" ? "P2" : "P1";
            this.state.isGameOver = true;
            this.state.statusMessage = "Opponent Disconnected";
            this.broadcast("roomDissolved");
        }

        this.state.players.delete(client.sessionId);
    }

    handlePlace(client: Client, message: any) {
        if (!this.state.gameStarted || this.state.isGameOver) return;

        const player = this.state.players.get(client.sessionId);
        if (!player || player.role !== this.state.turn) return;

        const { pieceId, shape, position } = message;
        // shape is number[][], position is {x, y}

        if (this.isValidMove(shape, position, player.role)) {
            // ... (rest of logic same but reset hasNoMoves)
            player.hasNoMoves = false;
            // Apply move
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] === 1) {
                        const idx = (position.y + r) * BOARD_SIZE + (position.x + c);
                        this.state.board[idx] = player.role;
                    }
                }
            }

            // Update hand & score
            const pieceIdx = player.hand.findIndex(p => p.id === pieceId);
            if (pieceIdx !== -1) {
                const piece = player.hand[pieceIdx];
                player.score += piece.value;
                player.hand.splice(pieceIdx, 1);
            }

            // Switch turn (Logic to handle passing if no moves? 
            // Simplifying: client checks if can move and sends "pass" if needed or we check here)
            this.state.turn = this.state.turn === "P1" ? "P2" : "P1";

            this.checkGameOver();
        }
    }

    isValidMove(pieceShape: number[][], position: any, role: string): boolean {
        let touchesCorner = false;
        let hasOwnPieces = false;

        for (let idx = 0; idx < this.state.board.length; idx++) {
            if (this.state.board[idx] === role) {
                hasOwnPieces = true;
                break;
            }
        }

        for (let r = 0; r < pieceShape.length; r++) {
            for (let c = 0; c < pieceShape[r].length; c++) {
                if (pieceShape[r][c] === 1) {
                    const bR = position.y + r;
                    const bC = position.x + c;

                    // Bounds check
                    if (bR < 0 || bR >= BOARD_SIZE || bC < 0 || bC >= BOARD_SIZE) return false;

                    // Collision
                    if (this.state.board[bR * BOARD_SIZE + bC] !== "") return false;

                    // Orthogonal rule
                    const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    for (const [dr, dc] of ortho) {
                        const nR = bR + dr;
                        const nC = bC + dc;
                        if (nR >= 0 && nR < BOARD_SIZE && nC >= 0 && nC < BOARD_SIZE) {
                            if (this.state.board[nR * BOARD_SIZE + nC] === role) return false;
                        }
                    }

                    // Diagonal rule
                    const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                    for (const [dr, dc] of diag) {
                        const nR = bR + dr;
                        const nC = bC + dc;
                        if (nR >= 0 && nR < BOARD_SIZE && nC >= 0 && nC < BOARD_SIZE) {
                            if (this.state.board[nR * BOARD_SIZE + nC] === role) touchesCorner = true;
                        }
                    }

                    // Start points
                    if (!hasOwnPieces) {
                        if (role === 'P1' && bR === 4 && bC === 4) touchesCorner = true;
                        if (role === 'P2' && bR === 9 && bC === 9) touchesCorner = true;
                    }
                }
            }
        }

        return touchesCorner;
    }

    checkGameOver() {
        let allHandsEmpty = true;
        let bothPassed = true;

        this.state.players.forEach(p => {
            if (p.hand.length > 0) allHandsEmpty = false;
            if (!p.hasNoMoves) bothPassed = false;
        });

        if (allHandsEmpty || bothPassed) {
            this.finishGame();
        }
    }

    finishGame() {
        let maxScore = -1;
        let winnerRole = "draw";

        this.state.players.forEach(p => {
            if (p.score > maxScore) {
                maxScore = p.score;
                winnerRole = p.role;
            } else if (p.score === maxScore) {
                winnerRole = "draw";
            }
        });

        this.state.winner = winnerRole;
        this.state.isGameOver = true;
    }
}
