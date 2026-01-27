import { Room, Client } from "colyseus";
import { DaifugoState, Player, Card as SchemaCard } from "./schema/DaifugoState";
import { DaifugoEngine, DaifugoState as EngineDaifugoState } from "../../../src/lib/trump/daifugo/engine";
import { Deck } from "../../../src/lib/trump/deck";
import { Card } from "../../../src/lib/trump/types";

export class DaifugoRoom extends Room<DaifugoState> {
    maxClients = 6;
    private engine: DaifugoEngine;
    private password?: string;
    private exchangeMoves: { from: string, to: string, cards: SchemaCard[] }[] = [];

    onCreate(options: any) {
        this.setState(new DaifugoState());
        this.engine = new DaifugoEngine();
        this.exchangeMoves = [];

        if (options.password) {
            this.password = options.password;
            this.setMetadata({ locked: true });
        }

        if (options.rules) {
            this.state.ruleRevolution = options.rules.revolution ?? true;
            this.state.rule8Cut = options.rules.is8Cut ?? true;
            this.state.rule11Back = options.rules.is11Back ?? true;
            this.state.ruleMiyakoOchi = options.rules.miyakoOchi ?? true;
            this.state.ruleSpade3 = options.rules.isSpade3 ?? false;
            this.state.jokerCount = options.rules.jokerCount ?? 2;
            // Local Rules
            this.state.rule5Skip = options.rules.is5Skip ?? false;
            this.state.rule7Watashi = options.rules.is7Watashi ?? false;
            this.state.ruleQBomber = options.rules.isQBomber ?? false;
            this.state.rule10Sute = options.rules.is10Sute ?? false;
        }

        this.onMessage("startGame", (client, options) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.role === 'host') {
                if (this.state.players.size >= 4) {
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
                if (rules.isSpade3 !== undefined) this.state.ruleSpade3 = rules.isSpade3;
                if (rules.miyakoOchi !== undefined) this.state.ruleMiyakoOchi = rules.miyakoOchi;
                if (rules.jokerCount !== undefined) this.state.jokerCount = Math.min(4, Math.max(0, rules.jokerCount));
                if (rules.is5Skip !== undefined) this.state.rule5Skip = rules.is5Skip;
                if (rules.is7Watashi !== undefined) this.state.rule7Watashi = rules.is7Watashi;
                if (rules.isQBomber !== undefined) this.state.ruleQBomber = rules.isQBomber;
                if (rules.is10Sute !== undefined) this.state.rule10Sute = rules.is10Sute;
            }
        });

        this.onMessage("playCard", (client, options: { cards: Card[] }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.turnPlayerId !== player.id) return;
            if (this.state.pendingAction) return;
            this.handlePlayCard(player.id, options.cards);
        });

        this.onMessage("pass", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (this.state.pendingAction && this.state.pendingActionPlayerId === player?.id) return;
            if (!player || this.state.turnPlayerId !== player.id) return;
            this.handlePass(player.id);
        });

        this.onMessage("7watashiPass", (client, options: { cards: Card[] }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.pendingAction !== '7watashi' || this.state.pendingActionPlayerId !== player.id) return;
            this.handle7Watashi(player, options.cards);
        });

        this.onMessage("qBomberSelect", (client, options: { ranks: string[] }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.pendingAction !== 'qbomber' || this.state.pendingActionPlayerId !== player.id) return;
            this.handleQBomber(player, options.ranks);
        });

        this.onMessage("startNextGame", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.role === 'host') {
                this.startNextGame();
            }
        });

        this.onMessage("exchangeCards", (client, options: { cards: Card[] }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;
            this.handleCardExchange(player, options.cards);
        });

        this.onMessage("10suteDiscard", (client, options: { cards: Card[] }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.pendingAction !== '10sute' || this.state.pendingActionPlayerId !== player.id) return;
            this.handle10Sute(player, options.cards);
        });

        this.onMessage("endGame", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.role === 'host') {
                // Reset everything for a fresh start or just keep current state but allow re-entry?
                // For now, let's just reset the game state to 'waiting' and clear hands/ranks
                this.resetGame();
            }
        });
    }

    onJoin(client: Client, options: { playerId: string, name: string, password?: string }) {
        if (this.password && this.password !== options.password) {
            throw new Error("Incorrect password");
        }

        const player = new Player();
        player.id = options.playerId || client.sessionId;
        player.name = options.name || "Guest";
        player.role = this.clients.length === 1 ? 'host' : 'guest';
        player.isReady = true;
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.players.size === 0) {
            // Room might auto-dispose, but good to clean up if needed
        } else {
            // Reassign host if needed
            const remaining = Array.from(this.state.players.values());
            if (!remaining.some(p => p.role === 'host')) {
                remaining[0].role = 'host';
            }
        }
    }

    private startGame() {
        if (this.state.status === 'playing') return;

        const deck = new Deck(this.state.jokerCount);
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

        this.state.turnPlayerId = this.state.players.get(clientIds[0])?.id || "";
        this.state.status = "playing";
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.isRevolution = false;
        this.state.is11Back = false;
        this.state.finishedPlayers.clear();
        this.state.pendingAction = '';
    }

    private broadcastEvent(type: string, message: string = "", playerId: string = "") {
        console.log('[DEBUG] broadcastEvent:', type, message, playerId);

        // Use direct broadcast to send event immediately (won't be overwritten)
        this.broadcast("gameEvent", { type, message, playerId, timestamp: Date.now() });

        // Also update state for late joiners / state sync
        this.state.lastEvent.type = type;
        this.state.lastEvent.message = message;
        this.state.lastEvent.playerId = playerId;
        this.state.lastEvent.timestamp = Date.now();
    }

    private handlePlayCard(playerId: string, cards: Card[]) {
        const client = this.clients.find(c => this.state.players.get(c.sessionId)?.id === playerId);
        if (!client) return;

        const playerSchema = this.state.players.get(client.sessionId);
        if (!playerSchema) return;

        const currentHand: Card[] = playerSchema.hand.map(c => ({ suit: c.suit, rank: c.rank } as Card));
        const lastMove = this.state.lastMovePlayerId ? {
            playerId: this.state.lastMovePlayerId,
            cards: this.state.lastMoveCards.map(c => ({ suit: c.suit, rank: c.rank } as Card))
        } : null;

        const rules = {
            isShibari: false,
            isSpade3: this.state.ruleSpade3,
            isStaircase: false,
            is11Back: this.state.rule11Back
        };

        const result = this.engine.validateMove(
            cards,
            currentHand,
            this.state.isRevolution,
            this.state.is11Back,
            lastMove,
            rules,
            false
        );

        if (!result.isValid) {
            client.send("error", result.errorMessage);
            return;
        }

        cards.forEach(c => {
            const index = playerSchema.hand.findIndex(pc => pc.suit === c.suit && pc.rank === c.rank);
            if (index !== -1) playerSchema.hand.splice(index, 1);
        });

        this.state.fieldCards.clear();
        cards.forEach(c => {
            const sc = new SchemaCard();
            sc.suit = c.suit;
            sc.rank = c.rank;
            this.state.fieldCards.push(sc);
        });

        this.state.lastMoveCards.clear();
        cards.forEach(c => {
            const sc = new SchemaCard();
            sc.suit = c.suit;
            sc.rank = c.rank;
            this.state.lastMoveCards.push(sc);
        });

        this.state.lastMovePlayerId = playerId;
        this.state.passCount = 0;

        if (result.isRevolution) {
            this.state.isRevolution = !this.state.isRevolution;
            this.broadcastEvent('revolution');
        }
        if (result.is11Back) {
            this.state.is11Back = true;
            this.broadcastEvent('11back');
        }

        const isFinished = playerSchema.hand.length === 0;
        if (isFinished) {
            this.state.finishedPlayers.push(playerId);
            const rankName = this.getProvisionalRank(this.state.finishedPlayers.length - 1, this.state.players.size);
            this.broadcastEvent('rank', rankName, playerId);

            if (this.state.finishedPlayers.length === 1) {
                this.state.winner = playerId;
                this.checkMiyakoOchi();
            }

            // Check if Game Over (Only 1 player left)
            if (this.checkGameOver()) return;
        }

        const is8Cut = this.state.rule8Cut && result.is8Cut;

        if (is8Cut) {
            this.broadcastEvent('8cut');

            this.clearField();
            if (isFinished) {
                const nextId = this.getNextActivePlayer(playerId);
                if (nextId) this.state.turnPlayerId = nextId;
                else this.finishGame();
            } else {
                this.state.turnPlayerId = playerId;
            }
            return;
        }

        // Spade 3 beats Joker - clear field like 8-cut
        const isSpade3Kill = this.state.ruleSpade3 && result.isSpade3;
        if (isSpade3Kill) {
            this.broadcastEvent('spade3');
            this.clearField();
            if (isFinished) {
                const nextId = this.getNextActivePlayer(playerId);
                if (nextId) this.state.turnPlayerId = nextId;
                else this.finishGame();
            } else {
                this.state.turnPlayerId = playerId;
            }
            return;
        }

        if (!isFinished && this.state.rule7Watashi && result.watashiCount && result.watashiCount > 0) {
            this.state.pendingAction = '7watashi';
            this.state.pendingActionPlayerId = playerId;
            this.state.pendingActionCount = Math.min(result.watashiCount, playerSchema.hand.length);
            return;
        }

        if (this.state.ruleQBomber && result.isQBomber) {
            this.state.pendingAction = 'qbomber';
            this.state.pendingActionPlayerId = playerId;
            this.state.pendingActionCount = result.bomberCount || 1; // Fallback to 1
            return;
        }

        // Check 10-Sute
        if (this.state.rule10Sute && !isFinished && cards.some(c => c.rank === '10')) {
            this.state.pendingAction = '10sute';
            this.state.pendingActionPlayerId = playerId;
            this.state.pendingActionCount = Math.min(cards.length, playerSchema.hand.length);
            return;
        }

        let skipStep = 0;
        if (this.state.rule5Skip && result.skipCount && result.skipCount > 0) {
            skipStep = result.skipCount;
        }

        const nextId = this.getNextActivePlayer(playerId, skipStep);
        if (nextId) this.state.turnPlayerId = nextId;
        else this.finishGame();
    }

    private handlePass(playerId: string) {
        this.state.passCount++;
        const activePlayers = Array.from(this.state.players.values()).filter(p => p.hand.length > 0).length;

        if (this.state.passCount >= activePlayers - 1) {
            // Everyone else passed
            // If the last move player is still active, it's their turn (field clear)
            // Logic handled by clearing field if next player is same as last mover
        }

        const nextId = this.getNextActivePlayer(playerId);
        if (!nextId) {
            this.checkGameOver(); // Ensure we run the proper finish logic including loser calc
            if (this.state.status !== 'finished') this.finishGame(); // Fallback if checkGameOver didn't trigger (e.g. forced finish)
            return;
        }

        if (nextId === this.state.lastMovePlayerId && this.state.passCount >= activePlayers - 1) {
            this.clearField();
        } else {
            // FIX: If last player finished, and everyone else passed, we must clear
            const isLastPlayerFinished = this.state.finishedPlayers.includes(this.state.lastMovePlayerId);
            if (isLastPlayerFinished && this.state.passCount >= activePlayers) {
                this.clearField();
            }
        }

        this.state.turnPlayerId = nextId;
    }

    private clearField() {
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.is11Back = false;
    }

    private handle7Watashi(player: Player, cards: Card[]) {
        // FIX: Allow passing less cards if hand has fewer than required
        const requiredCount = Math.min(this.state.pendingActionCount, player.hand.length);
        if (cards.length > requiredCount) return; // Allow EXACT match or LESS is logically implied by checks, but strict strict equality blocked it.
        // Actually, logic said "if (cards.length !== requiredCount) return;" which is correct IF requiredCount is min(pending, hand).
        // BUT if pending is 2 and hand is 1, required is 1. sending 1 should work.
        // User says "cannot pass last card".
        // If pending is 2, hand is 1. required = 1.
        // Client sends 1 card. 1 !== 1 is false. returns. Wait, it passes.
        // Maybe client sends 0? No.
        // Issue might be `pendingActionCount` not being updated?
        // Let's trust the fix: just ensure we use 'requiredCount' calculated correctly.
        if (cards.length !== requiredCount) return;

        for (const c of cards) {
            if (!player.hand.some(h => h.suit === c.suit && h.rank === c.rank)) return;
        }

        const nextId = this.getNextActivePlayer(player.id);
        if (!nextId) return;

        const nextPlayer = Array.from(this.state.players.values()).find(p => p.id === nextId);
        if (!nextPlayer) return;

        this.moveCards(player, nextPlayer, cards.map(c => {
            const sc = new SchemaCard();
            sc.suit = c.suit;
            sc.rank = c.rank;
            return sc;
        }));

        this.state.pendingAction = '';
        this.state.pendingActionPlayerId = '';
        this.state.pendingActionCount = 0;

        // Check if finished after passing
        const isFinished = player.hand.length === 0;
        if (isFinished) {
            this.state.finishedPlayers.push(player.id);
            const rankName = this.getProvisionalRank(this.state.finishedPlayers.length - 1, this.state.players.size);
            this.broadcastEvent('rank', rankName, player.id);

            if (this.state.finishedPlayers.length === 1) {
                this.state.winner = player.id;
                console.log('[DEBUG] First finisher in 7Watashi, calling checkMiyakoOchi');
                this.checkMiyakoOchi();
            }
        }



        if (this.state.turnPlayerId) this.state.turnPlayerId = nextId;

        if (this.checkGameOver()) return;
    }

    private handle10Sute(player: Player, cards: Card[]) {
        if (cards.length !== this.state.pendingActionCount) return;

        // Remove cards
        const toRemove: number[] = [];
        cards.forEach(c => {
            // Find exact match in hand
            const idx = player.hand.findIndex(h => h.suit === c.suit && h.rank === c.rank);
            if (idx !== -1) toRemove.push(idx);
        });

        if (toRemove.length !== this.state.pendingActionCount) return; // Must own cards

        // Sort descending to splice
        toRemove.sort((a, b) => b - a);
        toRemove.forEach(idx => player.hand.splice(idx, 1));

        this.state.pendingAction = '';
        this.state.pendingActionPlayerId = '';
        this.state.pendingActionCount = 0;

        // Check finish again
        if (player.hand.length === 0) {
            this.state.finishedPlayers.push(player.id);
            const rankName = this.getProvisionalRank(this.state.finishedPlayers.length - 1, this.state.players.size);
            this.broadcastEvent('rank', rankName, player.id);

            if (this.state.finishedPlayers.length === 1) {
                this.state.winner = player.id;
                console.log('[DEBUG] First finisher in 10Sute, calling checkMiyakoOchi');
                this.checkMiyakoOchi();
            }

            if (this.checkGameOver()) return;
        }

        // Advance turn
        const nextId = this.getNextActivePlayer(this.state.turnPlayerId);
        if (nextId) this.state.turnPlayerId = nextId;
        else this.finishGame();
    }

    private handleQBomber(player: Player, ranks: string[]) {
        // Validate
        if (!Array.isArray(ranks)) return; // Safety

        const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        for (const r of ranks) {
            if (!validRanks.includes(r)) return;
        }

        this.state.players.forEach(p => {
            // Remove ALL instances of EACH selected rank
            const toRemove: number[] = [];
            p.hand.forEach((c, idx) => {
                if (ranks.includes(c.rank)) toRemove.push(idx);
            });
            // Sort descending to splice safely
            toRemove.sort((a, b) => b - a);
            for (const idx of toRemove) {
                p.hand.splice(idx, 1);
            }
        });

        const newlyFinished: string[] = [];
        this.state.players.forEach(p => {
            if (p.hand.length === 0 && !this.state.finishedPlayers.includes(p.id)) {
                newlyFinished.push(p.id);
            }
        });

        newlyFinished.forEach(pid => {
            this.state.finishedPlayers.push(pid);
            const rankName = this.getProvisionalRank(this.state.finishedPlayers.length - 1, this.state.players.size);
            this.broadcastEvent('rank', rankName, pid);

            if (this.state.finishedPlayers.length === 1) {
                this.state.winner = pid;
                console.log('[DEBUG] First finisher in QBomber, calling checkMiyakoOchi');
                this.checkMiyakoOchi();
            }
        });
        if (this.checkGameOver()) return;

        this.state.pendingAction = '';
        this.state.pendingActionPlayerId = '';
        this.state.pendingActionCount = 0;

        const nextId = this.getNextActivePlayer(player.id);
        if (nextId) this.state.turnPlayerId = nextId;
        else this.finishGame();
    }

    private checkMiyakoOchi() {
        if (!this.state.ruleMiyakoOchi) return;
        if (this.state.finishedPlayers.length !== 1) return; // Only on first win
        if (this.state.droppedDaifugoId) return;

        const winnerId = this.state.finishedPlayers[0];
        const daifugo = Array.from(this.state.players.values()).find(p => p.rank === 'daifugo');

        if (daifugo && daifugo.id !== winnerId && !this.state.finishedPlayers.includes(daifugo.id)) {
            // Trigger Miyako-ochi
            console.log('[DEBUG] MIYAKO-OCHI TRIGGERED! Daifugo:', daifugo.name, 'Winner:', winnerId);
            this.state.droppedDaifugoId = daifugo.id;
            this.broadcastEvent('miyakoochi', `${daifugo.name}は都落ちしました！`, daifugo.id);
            // Game continues for others
        } else {
            console.log('[DEBUG] No Miyako-ochi: daifugo=', daifugo?.id, 'winner=', winnerId);
        }
    }

    private checkGameOver() {
        const finishedCount = this.state.finishedPlayers.length;
        const droppedCount = this.state.droppedDaifugoId ? 1 : 0;

        if (finishedCount + droppedCount >= this.state.players.size - 1) {
            // Game Over
            // Find the actual loser who played until the end (not the dropped player)
            const loser = Array.from(this.state.players.values()).find(p =>
                !this.state.finishedPlayers.includes(p.id) &&
                p.id !== this.state.droppedDaifugoId
            );

            if (loser) {
                this.state.finishedPlayers.push(loser.id);
                const rankName = this.getProvisionalRank(this.state.finishedPlayers.length - 1, this.state.players.size);
                this.broadcastEvent('rank', rankName, loser.id);
            }

            // Add dropped Daifugo as the LAST place (Daihinmin)
            if (this.state.droppedDaifugoId) {
                this.state.finishedPlayers.push(this.state.droppedDaifugoId);
                this.broadcastEvent('rank', '大貧民', this.state.droppedDaifugoId);
            }

            this.finishGame();
            return true;
        }
        return false;
    }

    private getNextActivePlayer(currentId: string, skipCount: number = 0): string | null {
        const players = Array.from(this.state.players.values()).sort((a, b) => a.id.localeCompare(b.id));
        let currentIndex = players.findIndex(p => p.id === currentId);
        if (currentIndex === -1) return null;

        let movesFound = 0;
        let loops = 0;
        while (movesFound <= skipCount && loops < players.length * 2) {
            currentIndex = (currentIndex + 1) % players.length;
            const p = players[currentIndex];
            // If dropped, they are effectively skipped (though game should end now)
            if (!this.state.finishedPlayers.includes(p.id) && p.id !== this.state.droppedDaifugoId) {
                if (movesFound === skipCount) return p.id;
                movesFound++;
            }
            loops++;
        }
        return null; // Return null if no active player found
    }

    private startNextGame() {
        const finishedOrder = this.state.finishedPlayers.toArray();
        const allPlayers = Array.from(this.state.players.values());

        let remaining = allPlayers.filter(p => !finishedOrder.includes(p.id)).map(p => p.id);

        // If Miyako-ochi occurred, force the dropped player to the very end
        if (this.state.droppedDaifugoId) {
            remaining = remaining.filter(id => id !== this.state.droppedDaifugoId);
            // Append dropped player at the end of remaining
            remaining.push(this.state.droppedDaifugoId);
        }

        const finalOrder = [...finishedOrder, ...remaining];

        const count = finalOrder.length;
        if (count >= 2) {
            const playerMap = new Map(allPlayers.map(p => [p.id, p]));

            // Assign ranks based on finish order
            // Dropped player is already at end of finalOrder, so they get daihinmin
            finalOrder.forEach((pid, index) => {
                const p = playerMap.get(pid);
                if (!p) return;
                if (index === 0) p.rank = 'daifugo';
                else if (index === 1 && count >= 4) p.rank = 'fugou';
                else if (index === count - 1) p.rank = 'daihinmin';
                else if (index === count - 2 && count >= 4) p.rank = 'binbou';
                else p.rank = 'heimin';
            });
            // Miyako-ochi notification was already sent during gameplay in checkMiyakoOchi()
            // No need for legacy swap logic - finalOrder already has correct ordering
        }

        // Cleanup for new game
        this.state.finishedPlayers.clear();
        this.state.passCount = 0;
        this.state.turnPlayerId = "";
        this.state.isRevolution = false;
        this.state.is11Back = false;
        this.state.droppedDaifugoId = "";
        this.state.pendingAction = "";
        this.state.pendingActionPlayerId = "";
        this.state.pendingActionCount = 0;
        this.state.winner = "";
        this.clearField();

        this.dealCards();
        this.setupExchangeOrStart();
    }

    private setupExchangeOrStart() {
        const players = Array.from(this.state.players.values());
        const hasRanks = players.some(p => p.rank === 'daifugo');
        if (!hasRanks) {
            this.startPlaying();
            return;
        }

        this.exchangeMoves = [];
        this.state.status = 'exchanging';
        this.state.exchangePending.clear();

        players.forEach(p => {
            if (p.rank === 'daifugo') this.state.exchangePending.set(p.id, 2);
            else if (p.rank === 'fugou') this.state.exchangePending.set(p.id, 1);
            else if (p.rank === 'daihinmin') this.queueAutoExchange(p, 2, 'daifugo');
            else if (p.rank === 'binbou') this.queueAutoExchange(p, 1, 'fugou');
        });

        // If no one needs to input (e.g. only auto players? impossible in Daifugo usually), check start
        if (this.state.exchangePending.size === 0) {
            this.executeExchanges();
            this.startPlaying();
        }
    }

    private queueAutoExchange(giver: Player, count: number, receiverRank: string) {
        const sortedHand = this.sortHandByStrength([...giver.hand]);
        const cardsToGive = sortedHand.slice(sortedHand.length - count);
        const receiver = Array.from(this.state.players.values()).find(p => p.rank === receiverRank);

        if (receiver) {
            const schemaCards: SchemaCard[] = [];
            cardsToGive.forEach(c => {
                const sc = new SchemaCard(); sc.suit = c.suit; sc.rank = c.rank;
                schemaCards.push(sc);
            });
            this.exchangeMoves.push({ from: giver.id, to: receiver.id, cards: schemaCards });
        }
    }

    private handleCardExchange(player: Player, selectedCards: Card[]) {
        const pending = this.state.exchangePending.get(player.id);
        if (!pending || selectedCards.length !== pending) return;

        let receiverRank = '';
        if (player.rank === 'daifugo') receiverRank = 'daihinmin';
        if (player.rank === 'fugou') receiverRank = 'binbou';

        const receiver = Array.from(this.state.players.values()).find(p => p.rank === receiverRank);
        if (!receiver) return;

        const cardsToGive: SchemaCard[] = [];
        for (const c of selectedCards) {
            const heldCard = player.hand.find(h => h.suit === c.suit && h.rank === c.rank);
            if (!heldCard) return;
            cardsToGive.push(heldCard);
        }

        this.exchangeMoves.push({ from: player.id, to: receiver.id, cards: cardsToGive });
        this.state.exchangePending.delete(player.id);

        if (this.state.exchangePending.size === 0) {
            this.executeExchanges();
            this.startPlaying();
        }
    }

    private executeExchanges() {
        this.exchangeMoves.forEach(move => {
            const from = this.state.players.get(move.from); // SessionID? No id is sessionId?
            // Wait, this.state.players is Map<SessionId, Player>.
            // Player.id IS usually sessionId, but logic might store custom id?
            // "player.id = options.playerId || client.sessionId"
            // So I should look up by iterating or Map?
            // this.state.players is Map<string, Player>. Key is SessionId.
            // Move stores `from: giver.id`.

            const fromPlayer = Array.from(this.state.players.values()).find(p => p.id === move.from);
            const toPlayer = Array.from(this.state.players.values()).find(p => p.id === move.to);

            if (fromPlayer && toPlayer) {
                this.moveCards(fromPlayer, toPlayer, move.cards);
            }
        });
        this.exchangeMoves = [];
    }

    private moveCards(from: Player, to: Player, cards: SchemaCard[]) {
        cards.forEach(c => {
            const idx = from.hand.findIndex(hc => hc.suit === c.suit && hc.rank === c.rank);
            if (idx !== -1) from.hand.splice(idx, 1);
            const newCard = new SchemaCard();
            newCard.suit = c.suit;
            newCard.rank = c.rank;
            to.hand.push(newCard);
        });
    }

    private sortHandByStrength(hand: SchemaCard[]): SchemaCard[] {
        const strength = (c: SchemaCard) => {
            if (c.suit === 'joker') return 15;
            const rank = parseInt(c.rank);
            if (isNaN(rank)) {
                if (c.rank === 'A') return 12;
                if (c.rank === 'J') return 9;
                if (c.rank === 'Q') return 10;
                if (c.rank === 'K') return 11;
                return 0;
            }
            if (rank === 2) return 13;
            if (rank === 1) return 12;
            return rank - 2;
        };
        return hand.sort((a, b) => strength(a) - strength(b));
    }

    private calculateScores() {
        const playerCount = this.state.players.size;
        this.state.finishedPlayers.forEach((pid, index) => {
            const player = Array.from(this.state.players.values()).find(p => p.id === pid);
            if (!player) return;

            // Simple Scoring Rules
            // 1st: +20, 2nd: +10, ..., Last: -20
            // Or better: based on rank names
            const rankName = this.getProvisionalRank(index, playerCount);
            let diff = 0;
            switch (rankName) {
                case '大富豪': diff = 20; break;
                case '富豪': diff = 10; break;
                case '平民': diff = 0; break;
                case '貧民': diff = -10; break;
                case '大貧民': diff = -20; break;
            }
            player.score += diff;
            player.lastScoreChange = diff;
        });
    }


    private finishGame() {
        this.calculateScores();
        this.state.status = 'finished';
    }

    private resetGame() {
        this.state.status = "waiting";
        this.state.players.forEach(p => {
            p.hand.clear();
            p.isReady = false;
            p.rank = "";
            // score is KEPT
        });
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.finishedPlayers.clear();
        this.broadcastEvent("reset", "Game Session Reset");
    }

    private startPlaying() {
        this.state.status = 'playing';
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.finishedPlayers.clear();
        this.state.isRevolution = false;
        this.state.is11Back = false;
        this.state.pendingAction = '';

        const winner = Array.from(this.state.players.values()).find(p => p.rank === 'daifugo');
        if (winner) this.state.turnPlayerId = winner.id;
    }

    private dealCards() {
        const deck = new Deck(this.state.jokerCount);
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
    }
    private getProvisionalRank(finishIndex: number, totalPlayers: number): string {
        // finishIndex is 0-based index in finishedPlayers
        if (finishIndex === 0) return '大富豪';
        if (totalPlayers >= 4) {
            if (finishIndex === 1) return '富豪';
            if (finishIndex === totalPlayers - 2) return '貧民';
        }
        if (finishIndex === totalPlayers - 1) return '大貧民';
        return '平民';
    }
}
