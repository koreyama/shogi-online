import { Room, Client } from "colyseus";
import { SimpleShogiState, SimpleShogiPlayer, SimpleShogiPiece } from "./schema/SimpleShogiState";

const ROWS = 4;
const COLS = 3;

interface MoveMessage {
    type: "move" | "drop";
    from?: { r: number, c: number }; // For move
    to: { r: number, c: number };
    pieceType?: string; // For drop
}

export class SimpleShogiRoom extends Room<SimpleShogiState> {
    maxClients = 2;



    onCreate(options: any) {
        console.log("SimpleShogiRoom created!", options);
        // Custom 6-digit numeric ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setState(new SimpleShogiState());

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        // Initialize Board (Lion, Giraffe, Elephant, Chick)
        this.initializeBoard();

        this.onMessage("move", (client, message: MoveMessage) => {
            if (!this.state.gameStarted || this.state.winner) return;

            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;

            if (message.type === "move") {
                this.handleMove(message.from!, message.to, player.role);
            } else if (message.type === "drop") {
                this.handleDrop(message.pieceType!, message.to, player.role);
            }
        });

        this.onMessage("restart", (client) => {
            // Handle restart if needed
        });
    }

    initializeBoard() {
        // Clear board
        this.state.board.clear();
        for (let i = 0; i < ROWS * COLS; i++) this.state.board.push(new SimpleShogiPiece("", "", "")); // Placeholder empty

        // Helper to set piece
        const setPiece = (r: number, c: number, type: string, owner: string) => {
            // IDs: "gote-king", "sente-pawn" etc.
            // Since there's only 1 of each mostly, but wait.
            // Gote: Top (Row 0)
            // Sente: Bottom (Row 3)
            // Gote Layout: R G E (From left to right?? Check standard)
            // Standard Dobutsu Shogi Setup:
            // Gote (Top): Giraffe(0,0), Lion(0,1), Elephant(0,2) -- wait, check image or standard rules
            // Usually: 
            // Gote: (0,0) Giraffe, (0,1) Lion, (0,2) Elephant
            //       (1,1) Chick
            // Sente: (3,0) Elephant, (3,1) Lion, (3,2) Giraffe
            //        (2,1) Chick
            // Note: Elephant and Giraffe positions mirror?
            // Let's verify standard Dobutsu Shogi setup.
            // Row 0 (Gote): G L E
            // Row 1 (Gote):   C  
            // Row 2 (Sente):   C
            // Row 3 (Sente): E L G
            // (Assuming 0,0 is Top-Left)

            this.state.board[r * COLS + c] = new SimpleShogiPiece(type, owner, `${owner}-${type}-${r}-${c}`);
        };

        // Gote types
        setPiece(0, 0, "rook", "gote"); // Giraffe
        setPiece(0, 1, "king", "gote"); // Lion
        setPiece(0, 2, "bishop", "gote"); // Elephant
        setPiece(1, 1, "pawn", "gote"); // Chick

        // Sente types
        setPiece(3, 0, "bishop", "sente"); // Elephant
        setPiece(3, 1, "king", "sente"); // Lion
        setPiece(3, 2, "rook", "sente"); // Giraffe
        setPiece(2, 1, "pawn", "sente"); // Chick

        // Ensure empty slots are properly empty objects or nulls? 
        // ArraySchema needs consistent type. We used "empty" type string?
        // Or updated schema to allow null? No, schema arrays are strict. 
        // We use empty string type for empty.
        // The default init loop filled with empty.
    }

    handleMove(from: { r: number, c: number }, to: { r: number, c: number }, role: string) {
        const fromIdx = from.r * COLS + from.c;
        const toIdx = to.r * COLS + to.c;
        const piece = this.state.board[fromIdx];
        const target = this.state.board[toIdx];

        // Basic validation
        if (piece.type === "") return; // Empty source
        if (piece.owner !== role) return; // Not my piece
        if (target.type !== "" && target.owner === role) return; // Cannot capture own piece

        // Validate movement capability
        if (!this.isValidMove(piece.type, piece.owner, from, to)) return;

        // Check for promotion (Chick -> Hen)
        // Sente promotes entering row 0 (top)
        // Gote promotes entering row 3 (bottom)
        let newType = piece.type;
        if (piece.type === "pawn") {
            if ((role === "sente" && to.r === 0) || (role === "gote" && to.r === 3)) {
                newType = "gold"; // Hen
            }
        }

        // Capture logic
        if (target.type !== "") {
            // Check Lion Capture (Victory)
            if (target.type === "king") {
                this.state.winner = role; // IMMEDIATE WIN
                // We still execute move visually?
            }

            // Capture piece: Demote Hen to Chick, add to hand
            const capturedType = target.type === "gold" ? "pawn" : target.type;
            const hand = role === "sente" ? this.state.senteHand : this.state.goteHand;
            hand.push(new SimpleShogiPiece(capturedType, role, `hand-${role}-${capturedType}-${Date.now()}`));
        }

        // Execute move
        this.state.board[toIdx] = new SimpleShogiPiece(newType, role, piece.id);
        this.state.board[fromIdx] = new SimpleShogiPiece("", "", ""); // clear src

        // Check Try Rule (Lion entering enemy base)
        // Lion reaches furthest rank without being captured on next turn?
        // Actually standard rules say: "If Lion reaches enemy area, you win. BUT if it can be captured immediately, you lose (or game continues? No, retry is usually win unless captured immediately)."
        // Simple Shogi usually: If Lion enters promotion zone, win.
        // Exception: If entering causes immediate capture?
        // Let's implement simple "Reach Zone = Win".
        if (newType === "king") {
            if ((role === "sente" && to.r === 0) || (role === "gote" && to.r === 3)) {
                this.state.winner = role;
            }
        }

        if (this.state.winner) {
            this.broadcast("gameOver", { winner: this.state.winner });
        } else {
            this.state.turn = this.state.turn === "sente" ? "gote" : "sente";
        }
    }

    handleDrop(pieceType: string, to: { r: number, c: number }, role: string) {
        const toIdx = to.r * COLS + to.c;
        if (this.state.board[toIdx].type !== "") return; // Occupied

        const hand = role === "sente" ? this.state.senteHand : this.state.goteHand;
        const handIndex = hand.findIndex(p => p.type === pieceType);
        if (handIndex === -1) return; // Not in hand

        // Remove from hand
        const piece = hand.at(handIndex); // Get piece to preserve ID? or new ID
        hand.splice(handIndex, 1);

        // Place on board
        this.state.board[toIdx] = new SimpleShogiPiece(pieceType, role, `drop-${role}-${pieceType}-${Date.now()}`);

        this.state.turn = this.state.turn === "sente" ? "gote" : "sente";
    }

    isValidMove(type: string, owner: string, from: { r: number, c: number }, to: { r: number, c: number }): boolean {
        const dr = to.r - from.r;
        const dc = to.c - from.c;

        // Direction multiplier: Sente moves UP (-r), Gote moves DOWN (+r)
        // We can normalize or just check manually.
        const forward = owner === "sente" ? -1 : 1;

        switch (type) {
            case "king": // Lion: All directions 1 step
                return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;

            case "rook": // Giraffe: Orthogonal 1 step
                return (Math.abs(dr) === 1 && dc === 0) || (dr === 0 && Math.abs(dc) === 1);

            case "bishop": // Elephant: Diagonal 1 step
                return Math.abs(dr) === 1 && Math.abs(dc) === 1;

            case "pawn": // Chick: 1 step forward
                return dc === 0 && dr === forward;

            case "gold": // Hen: Orthogonal + Forward Diagonals (Gold General movement)
                // Gold moves: Forward (Orthogonal + Diagonals), Side (Orthogonal), Backward (Orthogonal)
                // Cannot move Backward Diagonal
                // Sente forward: -r. Sente backward: +r.
                if (owner === "sente") {
                    // Cannot go +1r, +/-1c (Backward Diagonals)
                    if (dr === 1 && Math.abs(dc) === 1) return false;
                } else {
                    // Gote forward: +r. Gote backward: -r.
                    // Cannot go -1r, +/-1c
                    if (dr === -1 && Math.abs(dc) === 1) return false;
                }
                return Math.abs(dr) <= 1 && Math.abs(dc) <= 1; // Otherwise adjacent

            default:
                return false;
        }
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined SimpleShogi!");

        let role = "spectator";
        if (this.clients.length === 1) {
            role = Math.random() < 0.5 ? "sente" : "gote";
            // Store predefined role for P1? Wait, P2 needs the other.
            // Better: Assign based on count, but P1 gets random? 
            // If P1 gets gote, P2 gets sente.
            // Let's stick to P1=Sente for simplicity or random.
            role = "sente";
        } else if (this.clients.length === 2) {
            const p1 = this.state.players.values().next().value;
            role = p1.role === "sente" ? "gote" : "sente";
        }

        if (role !== "spectator") {
            const player = new SimpleShogiPlayer(client.sessionId, options.name || "Player", role);
            this.state.players.set(client.sessionId, player);
        }

        if (this.state.players.size === 2) {
            this.state.gameStarted = true;
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.gameStarted && !this.state.winner) {
            this.broadcast("roomDissolved");
            this.disconnect();
        }
    }
}
