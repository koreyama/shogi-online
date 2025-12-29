import { Room, Client } from "colyseus";
import { DaifugoState, Player, Card as SchemaCard } from "./schema/DaifugoState";
import { DaifugoEngine, DaifugoState as EngineDaifugoState } from "../../../src/lib/trump/daifugo/engine";
import { Deck } from "../../../src/lib/trump/deck";
import { Card } from "../../../src/lib/trump/types";

export class DaifugoRoom extends Room<DaifugoState> {
    maxClients = 6;
    private engine: DaifugoEngine;
    private password?: string;

    onCreate(options: any) {
        this.setState(new DaifugoState());
        this.engine = new DaifugoEngine();

        if (options.password) {
            this.password = options.password;
            this.setMetadata({ locked: true });
        }

        if (options.rules) {
            this.state.ruleRevolution = options.rules.revolution ?? true;
            this.state.rule8Cut = options.rules.is8Cut ?? true;
            this.state.rule11Back = options.rules.is11Back ?? true;
            this.state.ruleMiyakoOchi = options.rules.miyakoOchi ?? true;
            this.state.ruleStaircase = options.rules.isStaircase ?? false;
            this.state.ruleShibari = options.rules.isShibari ?? false;
            this.state.ruleSpade3 = options.rules.isSpade3 ?? false;
            this.state.jokerCount = options.rules.jokerCount ?? 2;
            // Local Rules
            this.state.ruleRokurokubi = options.rules.isRokurokubi ?? false;
            this.state.ruleKyukyusha = options.rules.isKyukyusha ?? false;
            this.state.rule5Skip = options.rules.is5Skip ?? false;
            this.state.rule7Watashi = options.rules.is7Watashi ?? false;
            this.state.ruleQBomber = options.rules.isQBomber ?? false;
        }

        this.onMessage("startGame", (client, options) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.role === 'host') {
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
                if (rules.isRokurokubi !== undefined) this.state.ruleRokurokubi = rules.isRokurokubi;
                if (rules.isKyukyusha !== undefined) this.state.ruleKyukyusha = rules.isKyukyusha;
                if (rules.is5Skip !== undefined) this.state.rule5Skip = rules.is5Skip;
                if (rules.is7Watashi !== undefined) this.state.rule7Watashi = rules.is7Watashi;
                if (rules.isQBomber !== undefined) this.state.ruleQBomber = rules.isQBomber;
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
        this.state.isShibari = false;
        this.state.finishedPlayers.clear();
        this.state.pendingAction = '';
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

        if (result.isRevolution) this.state.isRevolution = !this.state.isRevolution;
        if (result.is11Back) this.state.is11Back = true;
        if (result.isShibari) this.state.isShibari = true;

        const isFinished = playerSchema.hand.length === 0;
        if (isFinished) {
            this.state.finishedPlayers.push(playerId);
            if (this.state.finishedPlayers.length === 1) {
                this.state.winner = playerId;
            }
        }

        const isRokurokubi = this.state.ruleRokurokubi && result.isRokurokubi;
        const isKyukyusha = this.state.ruleKyukyusha && result.isKyukyusha;
        const is8Cut = this.state.rule8Cut && result.is8Cut;

        if (is8Cut || isRokurokubi || isKyukyusha) {
            this.clearField();
            if (isFinished) {
                const nextId = this.getNextActivePlayer(playerId);
                if (nextId) this.state.turnPlayerId = nextId;
                else this.state.status = 'finished';
            } else {
                this.state.turnPlayerId = playerId;
            }
            return;
        }

        if (!isFinished && this.state.rule7Watashi && result.watashiCount && result.watashiCount > 0) {
            this.state.pendingAction = '7watashi';
            this.state.pendingActionPlayerId = playerId;
            this.state.pendingActionCount = result.watashiCount;
            return;
        }

        if (this.state.ruleQBomber && result.isQBomber) {
            this.state.pendingAction = 'qbomber';
            this.state.pendingActionPlayerId = playerId;
            this.state.pendingActionCount = result.bomberCount || 1; // Fallback to 1
            return;
        }

        let skipStep = 0;
        if (this.state.rule5Skip && result.skipCount && result.skipCount > 0) {
            skipStep = result.skipCount;
        }

        const nextId = this.getNextActivePlayer(playerId, skipStep);
        if (nextId) this.state.turnPlayerId = nextId;
        else this.state.status = 'finished';
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
            this.state.status = 'finished';
            return;
        }

        if (nextId === this.state.lastMovePlayerId && this.state.passCount >= activePlayers - 1) {
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

    private handle7Watashi(player: Player, cards: Card[]) {
        if (cards.length !== this.state.pendingActionCount) return;

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

        if (this.state.turnPlayerId) this.state.turnPlayerId = nextId;
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

        newlyFinished.forEach(pid => this.state.finishedPlayers.push(pid));
        if (this.state.finishedPlayers.length >= this.state.players.size - 1) {
            // Game ends if only 1 player left
            // Find loser
            const loser = Array.from(this.state.players.values()).find(p => !this.state.finishedPlayers.includes(p.id));
            if (loser) this.state.finishedPlayers.push(loser.id); // Add loser last
            this.state.status = 'finished';
        }

        this.state.pendingAction = '';
        this.state.pendingActionPlayerId = '';
        this.state.pendingActionCount = 0;

        const nextId = this.getNextActivePlayer(player.id);
        if (nextId) this.state.turnPlayerId = nextId;
        else this.state.status = 'finished';
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
            if (!this.state.finishedPlayers.includes(p.id)) {
                if (movesFound === skipCount) return p.id;
                movesFound++;
            }
            loops++;
        }
        return null;
    }

    private startNextGame() {
        const finishedOrder = this.state.finishedPlayers.toArray();
        const allPlayers = Array.from(this.state.players.values());
        const remaining = allPlayers.filter(p => !finishedOrder.includes(p.id)).map(p => p.id);
        const finalOrder = [...finishedOrder, ...remaining];

        const count = finalOrder.length;
        if (count >= 2) {
            const playerMap = new Map(allPlayers.map(p => [p.id, p]));
            const previousDaifugo = allPlayers.find(p => p.rank === 'daifugo');

            finalOrder.forEach((pid, index) => {
                const p = playerMap.get(pid);
                if (!p) return;
                if (index === 0) p.rank = 'daifugo';
                else if (index === 1 && count >= 4) p.rank = 'fugou';
                else if (index === count - 1) p.rank = 'daihinmin';
                else if (index === count - 2 && count >= 4) p.rank = 'binbou';
                else p.rank = 'heimin';
            });

            if (this.state.ruleMiyakoOchi && previousDaifugo) {
                if (finalOrder[0] !== previousDaifugo.id) {
                    const newDaihinmin = allPlayers.find(p => p.rank === 'daihinmin');
                    const fallenAngel = previousDaifugo;
                    if (fallenAngel && newDaihinmin && fallenAngel.id !== newDaihinmin.id) {
                        const temp = fallenAngel.rank;
                        fallenAngel.rank = newDaihinmin.rank;
                        newDaihinmin.rank = temp;
                    }
                }
            }
        }

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

        this.state.status = 'exchanging';
        this.state.exchangePending.clear();

        players.forEach(p => {
            if (p.rank === 'daifugo') this.state.exchangePending.set(p.id, 2);
            else if (p.rank === 'fugou') this.state.exchangePending.set(p.id, 1);
            else if (p.rank === 'daihinmin') this.autoExchangeBestCards(p, 2, 'daifugo');
            else if (p.rank === 'binbou') this.autoExchangeBestCards(p, 1, 'fugou');
        });

        if (this.state.exchangePending.size === 0) {
            this.startPlaying();
        }
    }

    private autoExchangeBestCards(giver: Player, count: number, receiverRank: string) {
        const sortedHand = this.sortHandByStrength([...giver.hand]);
        const cardsToGive = sortedHand.slice(sortedHand.length - count);
        const receiver = Array.from(this.state.players.values()).find(p => p.rank === receiverRank);
        if (receiver) this.moveCards(giver, receiver, cardsToGive);
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

        this.moveCards(player, receiver, cardsToGive);
        this.state.exchangePending.delete(player.id);

        if (this.state.exchangePending.size === 0) {
            this.startPlaying();
        }
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

    private startPlaying() {
        this.state.status = 'playing';
        this.state.fieldCards.clear();
        this.state.lastMoveCards.clear();
        this.state.lastMovePlayerId = "";
        this.state.passCount = 0;
        this.state.finishedPlayers.clear();
        this.state.isRevolution = false;
        this.state.is11Back = false;
        this.state.isShibari = false;
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
}
