import { Room, Client } from "colyseus";
import { RainbowState, Player, Card } from "./schema/RainbowState";

const COLORS = ['red', 'blue', 'green', 'yellow'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export class RainbowRoom extends Room<RainbowState> {
    maxClients = 4;

    onCreate(options: any) {
        this.setState(new RainbowState());

        this.onMessage("startGame", (client, message) => {
            if (this.state.status !== "waiting") return;
            const player = this.state.players.get(client.sessionId);
            if (!player || player.seatIndex !== 0) return;
            if (this.state.players.size < 2) return;

            this.startGame();
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
        if (this.state.status !== "waiting") return;

        const player = new Player();
        player.id = client.id;
        player.sessionId = client.sessionId;
        player.name = options.name || "ゲスト";
        player.seatIndex = this.state.players.size;
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.status === "playing") {
            this.state.status = "finished";
            this.broadcast("gameFinished", { winner: "中断されました" });
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
            const hasMatchColor = cardsToPlay.some(c => c.color === this.state.currentColor || c.color === 'black');
            const hasMatchValue = (firstVal === top.value);

            if (hasMatchColor || hasMatchValue || firstVal === 'wild' || firstVal === 'wild4') {
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
            this.state.winner = player.id;
            this.state.status = "finished";
            this.broadcast("gameFinished", { winner: player.name });
            return;
        }

        // Effects calculation
        let skipNext = false;

        // Cumulative effects?
        // 2 Skip cards -> Skip 2 people? Or Skip self?
        // Standard House Rules: Skips stack. e.g. 2 Skips = Skip 2 players.
        // Reverses: 2 Reverses = No change. 3 Reverses = Reverse.
        // Draw2: Stack adds up.

        const count = cardsToPlay.length;

        if (firstVal === 'skip') {
            // Skip 'count' players
            for (let i = 0; i < count; i++) this.nextTurn(false, true); // Custom internal skip advance
            // Actually `nextTurn` logic needs to be robust.
            // We can just call `nextTurn` once but advance N steps.
        }
        else if (firstVal === 'reverse') {
            if (count % 2 === 1) {
                this.state.direction *= -1;
            }
            if (this.state.players.size === 2) {
                // In 2p, Reverse acts as Skip.
                // If 1 Reverse -> Skip 1 (My turn again).
                // If 2 Reverse -> Even number, direction same? 
                // Wait, 2p Reverse rule is tricky with multiple.
                // Let's simplify: Reverse changes direction. 
                // In 2p, if direction changed, it effectively skips?
                // Actually usually Reverse = Skip in 2p.
                // So odd reverses = skip next. Even reverses = no skip?
                // Let's stick to: Odd reverses switches direction.
                // In 2p, every direction switch IS a skip logically.
                // So if odd count, we skip next.
                if (count % 2 === 1) skipNext = true;
            }
        }
        else if (firstVal === 'draw2') {
            this.state.drawStack += (2 * count);
        }
        else if (firstVal === 'wild4') {
            this.state.drawStack += (4 * count);
        }

        // Normal turn advance (unless already handled by Skip loop)
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
        if (nextIndex >= players.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = players.length - 1;
        return players[nextIndex];
    }

    nextTurn(skip: boolean = false, isSkipCard: boolean = false) {
        let players = Array.from(this.state.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
        if (players.length === 0) return;

        const currentP = this.state.players.get(this.state.currentTurn);
        if (currentP) currentP.hasDrawn = false;

        const currentIndex = players.findIndex(p => p.sessionId === this.state.currentTurn);

        let steps = 1;
        if (skip) steps = 2; // Skip next player
        if (isSkipCard) steps = 2; // Skip card effect (advance 1 for turn + 1 for skip)
        // Wait, if I play 2 skips? 
        // Logic in handle: `for(count) nextTurn(false, true)`?
        // If I update `currentTurn` immediately, calling it multiple times works.
        // Let's rely on that.

        let stepDir = this.state.direction * steps;

        let nextIndex = (currentIndex + stepDir) % players.length;
        if (nextIndex < 0) nextIndex += players.length;
        while (nextIndex < 0) nextIndex += players.length;
        while (nextIndex >= players.length) nextIndex -= players.length;

        this.state.currentTurn = players[nextIndex].sessionId;
    }
}
