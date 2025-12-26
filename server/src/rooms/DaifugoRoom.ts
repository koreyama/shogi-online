import { Room, Client } from "colyseus";
import { DaifugoState, Player, Card as SchemaCard } from "./schema/DaifugoState";
import { DaifugoEngine, DaifugoState as EngineDaifugoState } from "../../../src/lib/trump/daifugo/engine";
import { Deck } from "../../../src/lib/trump/deck";
import { Card } from "../../../src/lib/trump/types";

export class DaifugoRoom extends Room<DaifugoState> {
    maxClients = 6;
    private engine: DaifugoEngine;

    onCreate(options: any) {
        // Fix: Use "daifugo_room" to ensure correct type if needed, but here roomId is auto-generated?
        // Actually options contains client options.
        this.setState(new DaifugoState());
        this.engine = new DaifugoEngine();

        if (options.rules) {
            this.state.ruleRevolution = options.rules.revolution ?? true;
            this.state.rule8Cut = options.rules.is8Cut ?? true;
            this.state.rule11Back = options.rules.is11Back ?? true;
            this.state.ruleMiyakoOchi = options.rules.miyakoOchi ?? true;
            this.state.ruleStaircase = options.rules.isStaircase ?? false;
            this.state.ruleShibari = options.rules.isShibari ?? false;
            this.state.ruleSpade3 = options.rules.isSpade3 ?? false;
            this.state.jokerCount = options.rules.jokerCount ?? 2; // Added jokerCount
        }

        this.onMessage("startGame", (client, options) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.role === 'host') {
                // Allow single player for debugging if needed, but usually >= 2
                if (this.state.players.size >= 1) {
                    this.startGame();
                }
            }
        });

        this.onMessage("updateRules", (client, rules: any) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.role === 'host') {
                if (rules.revolution !== undefined) this.state.ruleRevolution = rules.revolution;
                if (rules.is8Cut !== undefined) this.state.rule8Cut = rules.is8Cut;
                if (rules.is11Back !== undefined) this.state.rule11Back = rules.is11Back;
                if (rules.isStaircase !== undefined) this.state.ruleStaircase = rules.isStaircase;
                if (rules.isShibari !== undefined) this.state.ruleShibari = rules.isShibari;
                if (rules.isSpade3 !== undefined) this.state.ruleSpade3 = rules.isSpade3;
                if (rules.miyakoOchi !== undefined) this.state.ruleMiyakoOchi = rules.miyakoOchi;
                if (rules.jokerCount !== undefined) this.state.jokerCount = rules.jokerCount;
            }
        });

        this.onMessage("playCard", (client, options: { cards: Card[] }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.turnPlayerId !== player.id) return;
            this.handlePlayCard(player.id, options.cards);
        });

        this.onMessage("pass", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.turnPlayerId !== player.id) return;
            this.handlePass(player.id);
        });
    }

    onJoin(client: Client, options: { playerId: string, name: string }) {
        const player = new Player();
        player.id = options.playerId || client.sessionId;
        player.name = options.name || "Guest";
        player.role = this.clients.length === 1 ? 'host' : 'guest';
        player.isReady = true; // Auto ready for now
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        // Handle disconnect logic (auto-pass or end game?)
    }

    private startGame() {
        if (this.state.status === 'playing') return;

        const deck = new Deck(2); // 2 Jokers
        deck.shuffle();
        const clientIds = Array.from(this.state.players.keys());
        const hands = deck.deal(clientIds.length);

        clientIds.forEach((clientId, index) => {
            const player = this.state.players.get(clientId);
            if (player) {
                player.hand.clear();
                hands[index].forEach(c => {
                    const card = new SchemaCard();
                    card.suit = c.suit;
                    card.rank = c.rank;
                    player.hand.push(card);
                });
            }
        });

        // Determine First Player (Random for now)
        this.state.turnPlayerId = this.state.players.get(clientIds[0])?.id || "";
        this.state.status = "playing";
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.isRevolution = false;
        this.state.is11Back = false;
        this.state.isShibari = false;
        this.state.finishedPlayers.clear();
    }

    private handlePlayCard(playerId: string, cards: Card[]) {
        // Validation
        const client = this.clients.find(c => this.state.players.get(c.sessionId)?.id === playerId);
        if (!client) return;

        const playerSchema = this.state.players.get(client.sessionId);
        if (!playerSchema) return;

        // Convert Schema Hand to Plain Hand for validation
        const currentHand: Card[] = playerSchema.hand.map(c => ({ suit: c.suit, rank: c.rank } as Card));
        const lastMove = this.state.lastMovePlayerId ? {
            playerId: this.state.lastMovePlayerId,
            cards: this.state.lastMoveCards.map(c => ({ suit: c.suit, rank: c.rank } as Card))
        } : null;

        const rules = {
            isShibari: this.state.ruleShibari,
            isSpade3: this.state.ruleSpade3,
            isStaircase: this.state.ruleStaircase,
            is11Back: this.state.rule11Back
        };

        const result = this.engine.validateMove(
            cards,
            currentHand,
            this.state.isRevolution,
            this.state.is11Back,
            lastMove,
            rules,
            this.state.isShibari
        );

        if (!result.isValid) {
            client.send("error", result.errorMessage);
            return;
        }

        // Apply Move
        // 1. Remove cards from hand
        cards.forEach(c => {
            const index = playerSchema.hand.findIndex(pc => pc.suit === c.suit && pc.rank === c.rank);
            if (index !== -1) playerSchema.hand.splice(index, 1);
        });

        // 2. Update Field
        this.state.fieldCards.clear();
        cards.forEach(c => {
            const sc = new SchemaCard();
            sc.suit = c.suit;
            sc.rank = c.rank;
            this.state.fieldCards.push(sc);
            this.state.lastMoveCards.push(sc);
        });

        // Fix: Need to clear lastMoveCards before pushing? Yes.
        // Actually fieldCards and lastMoveCards are same? 
        // fieldCards usually represents "Current Stack". daifugo usually clears previous stack visually?
        // Let's keep them separate but synced for now.
        this.state.lastMoveCards.clear();
        cards.forEach(c => {
            const sc = new SchemaCard();
            sc.suit = c.suit;
            sc.rank = c.rank;
            this.state.lastMoveCards.push(sc);
        });

        this.state.lastMovePlayerId = playerId;
        this.state.passCount = 0;

        // 3. Effects
        if (result.isRevolution) this.state.isRevolution = !this.state.isRevolution;
        if (result.is11Back) this.state.is11Back = true;

        // Shibari Logic
        // If result said "establishes shibari", we turn it on?
        // validateMove returns isShibari as boolean for "is active" or "result"?
        // Engine says: isShibariResult = isShibariActive (keeps old) OR true (establishes new).
        if (result.isShibari) this.state.isShibari = true;

        // 4. Check Win
        if (playerSchema.hand.length === 0) {
            this.state.finishedPlayers.push(playerId);
            if (this.state.finishedPlayers.length === 1) {
                this.state.winner = playerId; // First place
            }
        }

        // 5. Next Turn
        if (result.is8Cut) {
            // 8-Giri: Field clear, same player turn (unless finished)
            this.clearField(); // Logic to reset field state

            if (playerSchema.hand.length === 0) {
                // If finished with 8, usually turn passes to next? Or specific rule?
                // "8-giri agari" might be forbidden or allowed. Assuming allowed => Next player starts free.
                const nextId = this.getNextActivePlayer(playerId);
                if (nextId) this.state.turnPlayerId = nextId;
                else this.state.status = 'finished';
            } else {
                // Same player turn
                this.state.turnPlayerId = playerId;
            }
        } else {
            // Normal turn pass
            const nextId = this.getNextActivePlayer(playerId);
            if (nextId) this.state.turnPlayerId = nextId;
            else this.state.status = 'finished';
        }
    }

    private handlePass(playerId: string) {
        this.state.passCount++;

        const activePlayerCount = this.clients.length - this.state.finishedPlayers.length; // Approximate active count
        // Better: count players with hand > 0
        const activePlayers = Array.from(this.state.players.values()).filter(p => p.hand.length > 0).length;

        if (this.state.passCount >= activePlayers - 1) {
            // Everyone passed except the one who played
            this.clearField();
            this.state.turnPlayerId = playerId; // Or the one who played last?
            // Wait, if I pass, and everyone else passes, it comes back to Last Move Player.
            // But if *I* passed, I am not the Last Move Player usually. 
            // Standard rule: If everyone passes after a play, the player who played gets to start again.
            // Logic: passCount counts consecutive passes.
            // If I play, passCount=0. Next passes -> 1. Next passes -> 2.
            // If 4 players, play -> pass(1) -> pass(2) -> pass(3). 3 passes = all others passed.
            // Then logic resets.
        }

        // For simplicity: Simple next player logic for now, fix flow later.
        // If passCount >= activePlayers - 1 (meaning everyone else passed):
        // The *next* player (who played last) gets turn? 
        // No, current logic in TrumpGameContent was:
        // if (gameState.passCount >= activeCount) { clear; turn = nextId (which is lastMove.playerId effectively?) }

        // Actually, if everyone passed, the turn should go to the player who made the last move (if they are still in game),
        // OR if they finished, the person after them?

        // Let's implement simpler logic:
        // Just find next player.
        // If next player is same as lastMovePlayerId (and pass logic met), clear field.

        const nextId = this.getNextActivePlayer(playerId);
        if (!nextId) {
            this.state.status = 'finished';
            return;
        }

        // Check if field should clear
        // If the next player IS the one who played last, they get a free turn.
        if (nextId === this.state.lastMovePlayerId) {
            this.clearField();
        }

        this.state.turnPlayerId = nextId;
    }

    private clearField() {
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.is11Back = false;
        this.state.isShibari = false;
    }

    private getNextActivePlayer(currentId: string): string | null {
        const clientIds = Array.from(this.state.players.keys());
        // Need to sort or keep order consistent. ClientIds might not be sorted.
        // Let's sort by join order? Or sessionId string.
        clientIds.sort();

        // Helper to find player ID from client ID
        const getPId = (cid: string) => this.state.players.get(cid)?.id;

        // Using Player IDs for logic
        const players = Array.from(this.state.players.values()).sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID
        const currentIndex = players.findIndex(p => p.id === currentId);

        for (let i = 1; i < players.length; i++) {
            const idx = (currentIndex + i) % players.length;
            const p = players[idx];
            // Check if player is still playing (not finished)
            if (!this.state.finishedPlayers.includes(p.id)) {
                return p.id;
            }
        }
        return null;
    }
}
