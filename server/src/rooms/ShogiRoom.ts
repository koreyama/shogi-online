import { Room, Client } from "colyseus";
import { ShogiState, ShogiPlayer, ShogiPiece } from "./schema/ShogiState";
import { createInitialState, executeMove, executeDrop, canPromote } from "../logic/engine";
import { getLegalMoves, getValidDrops } from "../logic/rules";
import { Piece, Player } from "../logic/types";

export class ShogiRoom extends Room<ShogiState> {
    // maxClients assigned by logic, not hardcoded to allow zombie cleanup
    private internalState: any;

    onCreate(options: any) {
        // Generate a simple 6-digit Room ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        console.log(`[ShogiRoom] Created! RoomId: ${this.roomId}`, options);
        if (options.isPrivate) {
            this.setPrivate(true);
        }
        this.setState(new ShogiState());

        // Initialize Logic State
        this.internalState = createInitialState();
        this.syncState();

        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });

        this.onMessage("drop", (client, message) => {
            this.handleDrop(client, message);
        });

        this.onMessage("resign", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && (player.role === 'sente' || player.role === 'gote')) {
                const winner = player.role === 'sente' ? 'gote' : 'sente';
                this.state.winner = winner;
                this.broadcast("gameOver", { winner, reason: "resign" });
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`[OnJoin] ${client.sessionId} joining...`);

        // 1. Zombie Purge: Critical to fixing "Spectator" bug
        // Remove valid players from state if they are NOT in the current connecting clients list
        const activeIds = new Set(this.clients.map(c => c.sessionId));
        const toRemove: string[] = [];
        this.state.players.forEach((p, key) => {
            if (!activeIds.has(key)) {
                toRemove.push(key);
            }
        });
        toRemove.forEach(key => {
            console.log(`[ZombiePurge] Removing ghost ${key}`);
            this.state.players.delete(key);
        });

        const player = new ShogiPlayer();
        player.id = client.sessionId;
        player.name = options.name || `Player ${this.clients.length}`; // Simple name

        // 2. Role Assignment
        let hasSente = false;
        let hasGote = false;
        this.state.players.forEach(p => {
            if (p.role === 'sente') hasSente = true;
            if (p.role === 'gote') hasGote = true;
        });

        if (!hasSente) {
            player.role = 'sente';
        } else if (!hasGote) {
            player.role = 'gote';
        } else {
            console.log(`[RoleFull] Assigning spectator. Sente=${hasSente}, Gote=${hasGote}`);
            player.role = 'spectator';
        }

        this.state.players.set(client.sessionId, player);
        console.log(`[OnJoin] Assigned ${player.role} to ${client.sessionId}`);

        // 3. Check Start
        let s = false, g = false;
        this.state.players.forEach(p => {
            if (p.role === 'sente') s = true;
            if (p.role === 'gote') g = true;
        });

        if (s && g) {
            console.log("[GameStart] Both roles filled. Starting game and LOCKING room.");
            this.state.gameStarted = true;
            this.lock(); // Prevent 3rd player from joining
            this.broadcast("gameStart", { startTurn: this.state.turn });
        }

        this.updateMetadata();
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`[OnLeave] ${client.sessionId} left. Consented: ${consented}`);

        const player = this.state.players.get(client.sessionId);
        const isParticipant = player && (player.role === 'sente' || player.role === 'gote');

        this.state.players.delete(client.sessionId);

        // If a participant leaves, dissolve the room immediately
        if (isParticipant) {
            console.log("[RoomDissolved] Participant left. Closing room.");
            // Notify remaining clients
            this.broadcast("roomDissolved", { reason: "Opponent disconnected" });

            // Unlock just in case, but we are kicking everyone
            this.unlock();

            // Disconnect everyone else after a short delay to ensure they receive the message
            this.clock.setTimeout(() => {
                this.clients.forEach(c => {
                    if (c.sessionId !== client.sessionId) {
                        c.leave();
                    }
                });
            }, 500);
        } else {
            // Spectator left (unlikely if locked, but possible if they joined before lock)
            this.updateMetadata();
        }
    }

    handleMove(client: Client, message: any) {
        const player = this.state.players.get(client.sessionId);
        if (!player || player.role !== this.state.turn) {
            client.send("serverErrorMessage", {
                message: `It's not your turn! (Role: ${player?.role}, Turn: ${this.state.turn})`
            });
            return;
        }

        if (this.state.winner) return;

        const { from, to, promote } = message;
        const piece = this.internalState.board[from.y][from.x];

        if (!piece || piece.owner !== player.role) {
            client.send("serverErrorMessage", { message: "Invalid piece selection!" });
            return;
        }

        const legalMoves = getLegalMoves(this.internalState.board, piece, from);
        const isLegal = legalMoves.some(m => m.x === to.x && m.y === to.y);

        if (!isLegal) {
            client.send("serverErrorMessage", { message: "Illegal move!" });
            return;
        }

        try {
            const newState = executeMove(this.internalState, from, to, promote);
            this.internalState = newState;
            this.syncState();

            if (newState.winner) {
                this.state.winner = newState.winner;
                this.broadcast("gameOver", { winner: newState.winner, reason: "mate" });
            }
        } catch (e: any) {
            console.error("MoveError", e);
            client.send("serverErrorMessage", { message: "Server error during move." });
        }
    }

    handleDrop(client: Client, message: any) {
        const player = this.state.players.get(client.sessionId);
        if (!player || player.role !== this.state.turn) {
            client.send("serverErrorMessage", {
                message: `It's not your turn! (Role: ${player?.role}, Turn: ${this.state.turn})`
            });
            return;
        }

        if (this.state.winner) return;

        const handPieces = this.internalState.hands[player.role as Player];
        const piece = handPieces.find((p: Piece) => p.type === message.pieceType);

        if (!piece) {
            client.send("serverErrorMessage", { message: "Piece not in hand!" });
            return;
        }

        const validDrops = getValidDrops(this.internalState.board, piece, player.role as Player, this.internalState.hands);
        const isLegal = validDrops.some(m => m.x === message.to.x && m.y === message.to.y);

        if (!isLegal) {
            client.send("serverErrorMessage", { message: "Illegal drop!" });
            return;
        }

        try {
            const newState = executeDrop(this.internalState, message.pieceType, message.to);
            this.internalState = newState;
            this.syncState();

            if (newState.winner) {
                this.state.winner = newState.winner;
                this.broadcast("gameOver", { winner: newState.winner, reason: "mate" });
            }
        } catch (e: any) {
            console.error("DropError", e);
            client.send("serverErrorMessage", { message: "Server error during drop." });
        }
    }

    private syncState() {
        const logic = this.internalState;

        // Sync Board
        this.state.board.clear();
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = logic.board[y][x];
                const sPiece = new ShogiPiece();
                if (cell) {
                    sPiece.type = cell.type;
                    sPiece.owner = cell.owner;
                    sPiece.isPromoted = cell.isPromoted;
                    sPiece.id = cell.id;
                } else {
                    sPiece.type = "empty";
                }
                this.state.board.push(sPiece);
            }
        }

        // Sync Hands
        this.state.handSente.clear();
        logic.hands.sente.forEach((p: Piece) => {
            const sp = new ShogiPiece();
            sp.type = p.type;
            sp.owner = p.owner;
            sp.isPromoted = p.isPromoted;
            sp.id = p.id;
            this.state.handSente.push(sp);
        });

        this.state.handGote.clear();
        logic.hands.gote.forEach((p: Piece) => {
            const sp = new ShogiPiece();
            sp.type = p.type;
            sp.owner = p.owner;
            sp.isPromoted = p.isPromoted;
            sp.id = p.id;
            this.state.handGote.push(sp);
        });

        this.state.turn = logic.turn;
        this.state.isCheck = logic.isCheck;
        this.state.winner = logic.winner || "";
    }

    private updateMetadata() {
        this.setMetadata({
            clients: this.clients.length,
            // Simple metadata for lobby
        });
    }
}
