import { Room, Client } from "colyseus";
import { RainbowState, Player, Card } from "./schema/RainbowState";

const COLORS = ['red', 'blue', 'green', 'yellow'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export class RainbowRoom extends Room<RainbowState> {
    maxClients = 8; // Buffer for StrictMode ghosts (logic enforces 4)

    onCreate(options: any) {
        this.setState(new RainbowState());

        this.onMessage("startGame", (client, message) => {
            if (this.state.status !== "waiting") return;
            const player = this.state.players.get(client.sessionId);
            if (!player || player.seatIndex !== 0) return;
            if (this.state.players.size < 2) return;

            this.startGame();
        });

        this.onMessage("restartGame", (client) => {
            // Only host can restart? Or anyone?
            // Ideally host.
            const player = this.state.players.get(client.sessionId);
            if (!player) return; // || player.seatIndex !== 0) return;

            // Reset State
            this.state.players.forEach(p => {
                while (p.hand.length > 0) p.hand.pop();
                p.rank = 0;
                p.hasDrawn = false;
                p.rank = 0;
            });
            while (this.state.drawPile.length > 0) this.state.drawPile.pop();
            while (this.state.discardPile.length > 0) this.state.discardPile.pop();
            this.state.winner = "";
            this.state.status = "waiting"; // Or directly playing?
            // Let's go directly to playing for "Play Again" feel, or waiting?
            // User said "Play Again button", implying restart.
            // Usually restart goes straight to game.
            this.startGame();
            this.broadcast("gameRestarted");
        });

        // Changed to receive array of indices
        this.onMessage("playCards", (client, message: { cardIndices: number[], color?: string }) => {
            this.handlePlayCards(client, message.cardIndices, message.color);
        });

        this.onMessage("drawCard", (client) => {
            if (this.state.status !== "playing") return;
            if (this.state.currentTurn !== client.sessionId) return;

            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            // If there is a stack (penalty), drawing means taking the penalty.
            if (this.state.drawStack > 0) {
                this.drawCard(client.sessionId, this.state.drawStack);
                this.state.drawStack = 0;
                this.nextTurn(); // Turn ends after taking penalty
                return;
            }

            // Normal Draw
            if (!player.hasDrawn) {
                this.drawCard(client.sessionId, 1);
                player.hasDrawn = true;
            } else {
                // Pass
                this.nextTurn();
            }
        });

        this.onMessage("sortHand", (client, message: { type: 'color' | 'number' }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const hand = Array.from(player.hand);
            hand.sort((a, b) => {
                if (message.type === 'color') {
                    if (a.color !== b.color) return a.color.localeCompare(b.color);
                    return a.value.localeCompare(b.value);
                } else {
                    // Number sort
                    const isANum = !isNaN(Number(a.value));
                    const isBNum = !isNaN(Number(b.value));
                    if (isANum && isBNum) return Number(a.value) - Number(b.value);
                    if (isANum && !isBNum) return -1;
                    if (!isANum && isBNum) return 1;
                    if (a.value !== b.value) return a.value.localeCompare(b.value);
                    return a.color.localeCompare(b.color);
                }
            });

            // Replace hand with sorted version
            // Doing this by splices or clear/push to trigger updates properly?
            // Schema arrays should work with replacement logic if we iterate?
            // Safer to clear and push?
            // Actually, ArraySchema doesn't have a simple 'set'. 
            // We'll clear and push.
            while (player.hand.length > 0) player.hand.pop();
            hand.forEach(c => player.hand.push(c));
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`[RainbowRoom] Join attempt: ${client.sessionId}. Current count: ${this.state.players.size}`);
        if (this.state.status !== "waiting") {
            console.log(`[RainbowRoom] Rejected join: Status is ${this.state.status}`);
            throw new Error("Game is already in progress");
        }

        // Prevent joining if room is logically full even if maxClients wasn't hit (redundant safety)
        if (this.state.players.size >= 4) {
            throw new Error("Room is full");
        }

        const player = new Player();
        player.id = client.id;
        player.sessionId = client.sessionId;
        player.name = options.name || "ゲスト";
        const takenSeats = new Set(Array.from(this.state.players.values()).map(p => p.seatIndex));
        let seatIndex = 0;
        while (takenSeats.has(seatIndex)) {
            seatIndex++;
        }
        player.seatIndex = seatIndex;
        if (this.state.players.size === 0) {
            player.isHost = true;
        }
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);

        // Robust Host Promotion: Ensure one host always exists
        const remainingPlayers = Array.from(this.state.players.values());
        if (remainingPlayers.length > 0) {
            const hasHost = remainingPlayers.some(p => p.isHost);
            if (!hasHost) {
                // Promote the player with the lowest seat index (oldest/first slot)
                remainingPlayers.sort((a, b) => a.seatIndex - b.seatIndex);
                remainingPlayers[0].isHost = true;
                console.log(`[RainbowRoom] Host promoted: ${remainingPlayers[0].name} (${remainingPlayers[0].seatIndex})`);
            }
        }

        if (this.state.status === "playing") {
            // If fewer than 2 players, end game? Or wait? 
            // Logic exists in win check but not here explicitly.
            // Usually onLeave triggers nextTurn or win check if playing.

            // Check if only 1 active player remains
            const activePlayers = Array.from(this.state.players.values()).filter(p => p.rank === 0);
            if (activePlayers.length <= 1) {
                this.state.status = "finished";
                this.broadcast("gameFinished", { winner: "中断されました" });
            } else {
                if (this.state.currentTurn === client.sessionId) {
                    this.nextTurn();
                }
            }
        }
    }

    startGame() {
        this.state.status = "playing";
        this.state.drawStack = 0;
        this.initDeck();
        this.dealCards();

        let firstCard = this.state.drawPile.pop();
        // Avoid starting with Wild or Action for simplicity if desired, 
        // but standard rules allow it (Wild = user chooses color, but here no user).
        // Let's retry if wild.
        while (firstCard && firstCard.color === 'black') {
            this.state.drawPile.unshift(firstCard);
            firstCard = this.state.drawPile.pop();
        }
        if (firstCard) {
            this.state.discardPile.push(firstCard);
            this.state.currentColor = firstCard.color;

            // Handle initial action card effects?
            // Simplified: Just ignore effect for start card to avoid confusion
        }

        const players = Array.from(this.state.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
        this.state.currentTurn = players[0].sessionId;

        this.state.players.forEach(p => {
            p.hasDrawn = false;
        });
    }

    initDeck() {
        const cards: Card[] = [];
        COLORS.forEach(c => {
            NUMBERS.forEach(n => {
                let card = new Card(); card.color = c; card.value = n; card.type = 'number';
                cards.push(card);
                if (n !== '0') {
                    card = new Card(); card.color = c; card.value = n; card.type = 'number';
                    cards.push(card);
                }
            });
            ['skip', 'reverse', 'draw2'].forEach(action => {
                for (let i = 0; i < 2; i++) {
                    const card = new Card(); card.color = c; card.value = action; card.type = 'action';
                    cards.push(card);
                }
            });
        });
        for (let i = 0; i < 4; i++) {
            const w = new Card(); w.color = 'black'; w.value = 'wild'; w.type = 'wild';
            cards.push(w);
            const w4 = new Card(); w4.color = 'black'; w4.value = 'wild4'; w4.type = 'wild';
            cards.push(w4);
        }
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // @ts-ignore
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        cards.forEach(c => this.state.drawPile.push(c));
    }

    dealCards() {
        this.state.players.forEach(player => {
            for (let i = 0; i < 7; i++) {
                const card = this.state.drawPile.pop();
                if (card) player.hand.push(card);
            }
        });
    }

    handlePlayCards(client: Client, indices: number[], chosenColor?: string) {
        if (this.state.status !== "playing") return;
        if (this.state.currentTurn !== client.sessionId) return;

        const player = this.state.players.get(client.sessionId);
        if (!player || !indices || indices.length === 0) return;

        // Create a copy for validation/logic that preserves the USER'S sent order
        const submittedIndices = [...indices];

        // For safe removal, we still need sorted descending indices
        const indicesToRemove = [...indices].sort((a, b) => b - a);

        // Get cards in the order user selected
        const cardsToPlay: Card[] = [];
        for (const idx of submittedIndices) {
            if (idx < 0 || idx >= player.hand.length) return;
            cardsToPlay.push(player.hand[idx]);
        }

        // --- Validation ---

        // 1. All cards must have same value (number/symbol)
        // EXCEPTION: If countering a penalty, we might allow mixing Draw2 and Wild4?
        // Actually, usually you play multiple Draw2s OR multiple Wild4s.
        // If I have Draw2 and Wild4, can I play both together?
        // Standard Uno: No. Values must match. 'draw2' != 'wild4'.
        // So even if I can counter Draw4 with Draw2, I can't play them *together* in one move unless I change rule 1.
        // Let's keep rule 1 (Same Value) for *simultaneous* play.
        // User said "multiple cards... decide order", probably for color shifting (Red 5 -> Blue 5).
        // Countering is usually a single card or set of same cards.

        const firstVal = cardsToPlay[0].value;
        const allSameValue = cardsToPlay.every(c => c.value === firstVal);
        if (!allSameValue) return;

        // 2. Check against current field state
        const top = this.state.discardPile[this.state.discardPile.length - 1];
        let valid = false;

        // Special case: Stacking (Counter Attitude)
        if (this.state.drawStack > 0) {
            // Must play a card that adds to stack
            const lastType = top.value; // 'draw2' or 'wild4' usually

            // Allow mixing: Draw2 can counter Wild4, Wild4 can counter Draw2
            // Just check if the played card is a penalty card
            const isPenaltyCard = (firstVal === 'draw2' || firstVal === 'wild4');

            if (isPenaltyCard) {
                valid = true;
            }

            if (!valid) return; // Cannot play non-stack card during penalty
        } else {
            // Normal play

            // Rule Update (Unified):
            // The FIRST card played (cardsToPlay[0]) must be legally playable on the current field.
            // (Subsequent cards must match the first card, which is already checked by 'allSameValue' above).
            // So we simply check if cardsToPlay[0] matches the current state (Color OR Value OR Wild).

            const firstCard = cardsToPlay[0];
            const matchesColor = firstCard.color === this.state.currentColor || firstCard.color === 'black';
            const matchesValue = (firstVal === top.value);

            if (matchesColor || matchesValue || firstVal === 'wild' || firstVal === 'wild4') {
                valid = true;
            }
        }

        if (!valid) return;

        // --- Execution ---

        // Remove from hand (using sorted indices to safely enable splice)
        for (const idx of indicesToRemove) {
            player.hand.splice(idx, 1);
        }

        // Add to discard in the ORDER chosen by user (submittedIndices order)
        cardsToPlay.forEach(c => this.state.discardPile.push(c));

        // Update Color
        const lastCard = cardsToPlay[cardsToPlay.length - 1]; // The new top
        if (lastCard.color === 'black') {
            this.state.currentColor = (chosenColor && COLORS.includes(chosenColor)) ? chosenColor : 'red';
        } else {
            this.state.currentColor = lastCard.color;
        }

        // Win Check
        if (player.hand.length === 0) {
            // Calculate current max rank
            const currentRanks = Array.from(this.state.players.values())
                .map(p => p.rank)
                .filter(r => r > 0);
            const nextRank = currentRanks.length > 0 ? Math.max(...currentRanks) + 1 : 1;

            player.rank = nextRank;
            this.broadcast("playerFinished", { playerId: player.id, rank: player.rank });

            // Check if Game Over (0 or 1 active players left)
            const activePlayers = Array.from(this.state.players.values()).filter(p => p.rank === 0);

            if (activePlayers.length <= 1) {
                // If 1 player left, assign them the last rank immediately?
                // Standard: Yes, last place.
                if (activePlayers.length === 1) {
                    activePlayers[0].rank = nextRank + 1;
                }

                this.state.status = "finished";
                // Determine winner (Rank 1)
                const winner = Array.from(this.state.players.values()).find(p => p.rank === 1);
                this.broadcast("gameFinished", { winner: winner?.name || "Unknown" });
                return;
            } else {
                // Game continues.
                // Pass turn to next active player.
                // We shouldn't execute further logic below (like nextTurn) for THIS player, 
                // but we need to advance the turn.
                // So we call nextTurn() then return.
                this.nextTurn();
                return;
            }
        }

        // Effects calculation
        let skipNext = false;

        // ... (Effect logic) ...

        const count = cardsToPlay.length;

        if (firstVal === 'skip') {
            // ...
            for (let i = 0; i < count; i++) this.nextTurn(false, true);
        }
        else if (firstVal === 'reverse') {
            // ...
            if (count % 2 === 1) {
                this.state.direction *= -1;
            }
            if (this.state.players.size === 2) {
                if (count % 2 === 1) skipNext = true;
            }
        }
        else if (firstVal === 'draw2') {
            this.state.drawStack += (2 * count);
        }
        else if (firstVal === 'wild4') {
            this.state.drawStack += (4 * count);
        }

        // Normal turn advance
        if (firstVal !== 'skip') {
            this.nextTurn(skipNext);
        }
    }

    drawCard(sessionId: string, count: number) {
        const player = this.state.players.get(sessionId);
        if (!player) return;

        for (let i = 0; i < count; i++) {
            if (this.state.drawPile.length === 0) {
                this.reshuffleDiscard();
            }
            const c = this.state.drawPile.pop();
            if (c) player.hand.push(c);
        }
    }

    reshuffleDiscard() {
        if (this.state.discardPile.length <= 1) return;
        const top = this.state.discardPile.pop();
        while (this.state.discardPile.length > 0) {
            const c = this.state.discardPile.pop();
            if (c) this.state.drawPile.push(c);
        }
        for (let i = this.state.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // @ts-ignore
            const temp = this.state.drawPile[i];
            // @ts-ignore
            this.state.drawPile[i] = this.state.drawPile[j];
            // @ts-ignore
            this.state.drawPile[j] = temp;
        }
        if (top) this.state.discardPile.push(top);
    }

    getNextPlayer() {
        const players = Array.from(this.state.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
        const currentIndex = players.findIndex(p => p.sessionId === this.state.currentTurn);
        let nextIndex = (currentIndex + this.state.direction);

        // Loop to find next ACTIVE player (rank === 0)
        // With safeguards for infinite loop if all finished (handled by check above)
        let found = false;
        let attempts = 0;

        while (!found && attempts < players.length * 2) {
            if (nextIndex >= players.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = players.length - 1;

            if (players[nextIndex].rank === 0) {
                found = true;
            } else {
                nextIndex += this.state.direction;
            }
            attempts++;
        }
        return players[nextIndex];
    }

    nextTurn(skip: boolean = false, isSkipCard: boolean = false) {
        let players = Array.from(this.state.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
        if (players.length === 0) return;

        const currentP = this.state.players.get(this.state.currentTurn);
        if (currentP) currentP.hasDrawn = false;

        const currentIndex = players.findIndex(p => p.sessionId === this.state.currentTurn);

        // Calculate Steps based on Logic
        // But simply advancing index N times while skipping invalid players is safer.

        let steps = 1;
        if (skip) steps = 2;
        if (isSkipCard) steps = 2;

        // Apply direction? 
        // Logic: Move 'steps' valid slots in 'direction'.

        let targetIndex = currentIndex;

        for (let s = 0; s < steps; s++) {
            // Find next valid
            let found = false;
            let attempts = 0;
            let tempIndex = targetIndex;

            while (!found && attempts < players.length + 1) {
                tempIndex += this.state.direction;

                // Wrap
                if (tempIndex >= players.length) tempIndex = 0; // Assuming direction 1
                if (tempIndex < 0) tempIndex = players.length - 1; // Assuming direction -1
                // Wait, logic needs robust modulo for negative.
                while (tempIndex < 0) tempIndex += players.length;
                while (tempIndex >= players.length) tempIndex -= players.length;

                if (players[tempIndex].rank === 0) {
                    found = true;
                    targetIndex = tempIndex;
                }
                attempts++;
            }

            // If we didn't find anyone, game should be over, but for safety:
            if (!found) targetIndex = currentIndex;
        }

        this.state.currentTurn = players[targetIndex].sessionId;
    }
}
