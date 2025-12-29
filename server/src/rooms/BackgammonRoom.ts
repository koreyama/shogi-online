import { Room, Client } from "colyseus";
import { BackgammonState } from "./schema/BackgammonState";

export class BackgammonRoom extends Room<BackgammonState> {
    maxClients = 2;

    onCreate(options: any) {
        this.setState(new BackgammonState());

        this.onMessage("roll", (client, message) => {
            if (this.state.winner) return;
            const playerColor = client.sessionId === this.state.whitePlayerId ? 1 : 2;
            if (playerColor !== this.state.turn) return;
            if (this.state.dice.length > 0) return; // Already rolled

            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;

            this.state.dice.push(d1);
            this.state.dice.push(d2);

            if (d1 === d2) {
                // Doubles: duplicate moves (4 total)
                this.state.dice.push(d1);
                this.state.dice.push(d2);
            }

            // Auto-check if legal moves exist? 
            // For MVP, we'll let user try or pass? 
            // Backgammon rules say you MUST move if possible.
            // We'll leave it to client to visualize or "Pass" button if stuck.
        });

        this.onMessage("move", (client, message) => {
            // message: { from: number | "bar", to: number | "off" }
            if (this.state.winner) return;

            const playerColor = client.sessionId === this.state.whitePlayerId ? 1 : 2;
            if (playerColor !== this.state.turn) return;
            if (this.state.dice.length === 0) return;

            const from = message.from; // 0-23 or "bar"
            const to = message.to;     // 0-23 or "off"

            const dist = this.validateMove(playerColor, from, to);
            if (dist !== -1) {
                // Execute Move
                this.executeMove(playerColor, from, to);

                // Remove used die
                const dieIndex = this.state.dice.findIndex(d => d === dist);
                if (dieIndex !== -1) {
                    this.state.dice.splice(dieIndex, 1);
                } else {
                    // Could be that 'to' was 'off' and die was larger than needed?
                    // In bear-off, if die > dist, and no pieces on higher points, it's valid.
                    // We need to handle that logic.
                    // For now simple exact match or larger if bearoff.
                    if (to === "off") {
                        // Find die >= dist (smallest sufficient die usually required? 
                        // Rules: "Exact roll required unless piece is on highest point and roll is larger")
                        // Simplified: Remove the first die >= dist
                        const validDieIdx = this.state.dice.findIndex(d => d >= dist);
                        if (validDieIdx !== -1) this.state.dice.splice(validDieIdx, 1);
                    }
                }

                this.checkWin(playerColor);

                if (this.state.dice.length === 0 && !this.state.winner) {
                    this.switchTurn();
                }
            }
        });

        this.onMessage("pass", (client) => {
            // If no moves possible, player can pass
            // Simple basic logic: Allow pass if dice not empty
            const playerColor = client.sessionId === this.state.whitePlayerId ? 1 : 2;
            if (playerColor !== this.state.turn) return;
            if (this.state.dice.length > 0) {
                this.state.dice.clear();
                this.switchTurn();
            }
        });
    }

    validateMove(color: number, from: any, to: any): number {
        // Returns distance used (die value) or -1 if invalid

        let dist = 0;

        // 1. From Bar?
        if (from === "bar") {
            if (color === 1 && this.state.bar.white === 0) return -1;
            if (color === 2 && this.state.bar.black === 0) return -1;

            // White enters at 23, 22... (Dice 1 means 23)
            // Wait, White moves 23 -> 0. Entering from Bar means entering at 23?
            // Standard: White Bar is "25". Enters into Black Home (18-23)? 
            // My Setup: White Home 0-5. Moves 23 -> 0.
            // Entering matches: White enters at 24 - Die. (e.g. Die 1 -> Point 23)
            // Black enters at -1 + Die? (e.g. Die 1 -> Point 0)

            // Let's refine My Direction:
            // White: 23 -> 0. Bar is effectively 24. Bear off is -1.
            // Black: 0 -> 23. Bar is effectively -1. Bear off is 24.

            if (typeof to !== "number") return -1;

            if (color === 1) { // White
                // Enters 23..18. 
                // Distance = 24 - to.
                dist = 24 - to;
                if (dist < 1 || dist > 6) return -1;
            } else { // Black
                // Enters 0..5
                // Distance = to - (-1) = to + 1.
                dist = to + 1;
                if (dist < 1 || dist > 6) return -1;
            }
        }
        // 2. Regular Move
        else if (typeof from === "number" && typeof to === "number") {
            // MUST NOT have pieces on bar
            if (color === 1 && this.state.bar.white > 0) return -1;
            if (color === 2 && this.state.bar.black > 0) return -1;

            if (this.state.board[from].color !== color || this.state.board[from].count === 0) return -1;

            if (color === 1) { // White 23->0
                if (to >= from) return -1; // Wrong direction
                dist = from - to;
            } else { // Black 0->23
                if (to <= from) return -1;
                dist = to - from;
            }
        }
        // 3. Bear Off
        else if (typeof from === "number" && to === "off") {
            // Must have all pieces in home board
            if (!this.canBearOff(color)) return -1;

            if (color === 1) { // White Home 0-5
                // from must be 0-5
                if (from > 5) return -1;
                dist = from + 1; // e.g. from 0 needs 1. from 5 needs 6.
            } else { // Black Home 18-23
                if (from < 18) return -1;
                dist = 24 - from; // e.g. from 23 needs 1. from 18 needs 6.
            }
        } else {
            return -1;
        }

        // Validate Die
        if (!this.hasDie(dist, color, from, to)) return -1;

        // Validate Destination (Blocked?)
        if (to !== "off") {
            const dest = this.state.board[to as number];
            // Blocked if Opponent has >= 2 chess
            if (dest.color !== 0 && dest.color !== color && dest.count >= 2) return -1;
        }

        return dist;
    }

    hasDie(dist: number, color: number, from: any, to: any): boolean {
        // Exact match?
        if (this.state.dice.includes(dist)) return true;

        // Bear off exception: larger die allowed IF no pieces on higher points
        if (to === "off") {
            const availableDice = this.state.dice.filter(d => d > dist);
            if (availableDice.length > 0) {
                // Check higher points
                if (color === 1) { // White (0-5)
                    // from is e.g. 2. Dist 3.
                    // Must check 3, 4, 5... (indices > from)
                    for (let i = from as number + 1; i <= 5; i++) { // wait, indices 3,4,5 are LOWER dist?
                        // White Home: 5,4,3,2,1,0. 
                        // Check points strictly further from goal than 'from'?
                        // Goal is -1.
                        // From 2. Dist 3. Die 4 used?
                        // Means we are at idx 2. Is there anything at idx 3,4,5? (indices > from)
                        // Wait, indices > from are FURTHER from goal (-1) for White.
                        // Correct.
                        if (this.state.board[i].color === color && this.state.board[i].count > 0) return false;
                    }
                } else { // Black (18-23)
                    // Goal 24.
                    // From 21. Dist 3. Die 4 used?
                    // Means we are at idx 21. Is there anything at idx 20, 19, 18? (indices < from)
                    // Correct.
                    for (let i = from as number - 1; i >= 18; i--) {
                        if (this.state.board[i].color === color && this.state.board[i].count > 0) return false;
                    }
                }
                return true;
            }
        }
        return false;
    }

    canBearOff(color: number): boolean {
        // Are ALL pieces in home board?
        let totalPieces = 0;
        let homePieces = 0;

        // Count Bar
        if (color === 1 && this.state.bar.white > 0) return false;
        if (color === 2 && this.state.bar.black > 0) return false;

        for (let i = 0; i < 24; i++) {
            const p = this.state.board[i];
            if (p.color === color) {
                totalPieces += p.count;
                if (color === 1) { // White Home 0-5
                    if (i <= 5) homePieces += p.count;
                } else { // Black Home 18-23
                    if (i >= 18) homePieces += p.count;
                }
            }
        }
        // Also check off? 
        // We only care if on-board pieces are in home.
        return totalPieces === homePieces && totalPieces > 0;
    }

    executeMove(color: number, from: any, to: any) {
        // Remove from source
        if (from === "bar") {
            if (color === 1) this.state.bar.white--;
            else this.state.bar.black--;
        } else {
            this.state.board[from as number].count--;
            if (this.state.board[from as number].count === 0) {
                this.state.board[from as number].color = 0;
            }
        }

        // Add to dest
        if (to === "off") {
            if (color === 1) this.state.off.white++;
            else this.state.off.black++;
        } else {
            const dest = this.state.board[to as number];

            // Hitting Blot
            if (dest.color !== 0 && dest.color !== color && dest.count === 1) {
                // Hit! Move opponent to bar.
                if (dest.color === 1) this.state.bar.white++;
                else this.state.bar.black++;
                dest.count = 0; // Will become 1 shortly
                dest.color = color;
            }

            dest.color = color;
            dest.count++;
        }
    }

    switchTurn() {
        this.state.turn = this.state.turn === 1 ? 2 : 1;
        this.state.dice.clear();
    }

    checkWin(color: number) {
        if (color === 1 && this.state.off.white === 15) {
            this.state.winner = "white";
        } else if (color === 2 && this.state.off.black === 15) {
            this.state.winner = "black";
        }
    }

    onJoin(client: Client, options: any) {
        // 1. Zombie Purge: Ensure state doesn't hold disconnected players
        const activeSessions = new Set(this.clients.map(c => c.sessionId));
        if (this.state.whitePlayerId && !activeSessions.has(this.state.whitePlayerId)) {
            this.state.whitePlayerId = "";
            this.state.whitePlayerName = "";
        }
        if (this.state.blackPlayerId && !activeSessions.has(this.state.blackPlayerId)) {
            this.state.blackPlayerId = "";
            this.state.blackPlayerName = "";
        }

        // 2. Assign Role
        if (!this.state.whitePlayerId) {
            this.state.whitePlayerId = client.sessionId;
            this.state.whitePlayerName = options.playerName || "Player 1";
        } else if (!this.state.blackPlayerId) {
            this.state.blackPlayerId = client.sessionId;
            this.state.blackPlayerName = options.playerName || "Player 2";
        } else {
            // Room is full
            client.leave(4400, "Room is full");
            return;
        }

        // 3. Lock Room if full
        if (this.state.whitePlayerId && this.state.blackPlayerId) {
            this.lock();
        }
    }

    onLeave(client: Client, consented: boolean) {
        // Handle Disconnection
        const isWhite = this.state.whitePlayerId === client.sessionId;
        const isBlack = this.state.blackPlayerId === client.sessionId;

        if (this.state.winner) {
            // Game already over
            return;
        }

        // If game is in progress (both players were present)
        if (this.state.whitePlayerId && this.state.blackPlayerId) {
            // Game was started, so this is a forfeit
            if (isWhite) {
                this.state.winner = "black";
            } else if (isBlack) {
                this.state.winner = "white";
            }
        } else {
            // Game hadn't started fully (waiting state)
            // Clear the slot so someone else can join (or re-join)
            if (isWhite) {
                this.state.whitePlayerId = "";
                this.state.whitePlayerName = "";
            }
            if (isBlack) {
                this.state.blackPlayerId = "";
                this.state.blackPlayerName = "";
            }
            this.unlock();
        }
    }
}
