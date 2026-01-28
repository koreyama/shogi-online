import { Room, Client } from "colyseus";
import { ArraySchema } from "@colyseus/schema";
import { CardGameState, PlayerStateSchema, GameLogEntrySchema, StatusEffectSchema, EquipmentSchema, TrapSchema, TurnStateSchema, FieldSchema } from "./schema/CardGameState";
import {
    createInitialState,
    playCard,
    endTurn,
    useUltimate,
    manaCharge,
    toggleManaChargeMode,
    selectCardForCharge,
    discardAndDraw
} from "../lib/card-game/engine"; // Relative import to shared logic
import { GameState, PlayerState, GameLogEntry, StatusEffect, Trap, Field } from "../lib/card-game/types";

export class CardGameRoom extends Room<CardGameState> {
    maxClients = 2;
    // Internal authoritative state (Plain Object)
    private game: GameState | null = null;
    private playerIds: string[] = [];
    private clientMap: Map<string, string> = new Map(); // clientId -> playerId

    onCreate(options: any) {
        // Generate a 6-digit Room ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setState(new CardGameState());
        this.state.roomId = this.roomId;

        this.onMessage("playCard", (client, message: { cardId: string, targetId?: string }) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            try {
                const newState = playCard(this.game, playerId, message.cardId, message.targetId);
                this.game = newState; // Engine returns new state (functional-ish)
                this.syncState();
            } catch (e) {
                console.error("Error in playCard:", e);
            }
        });

        this.onMessage("endTurn", (client) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            const newState = endTurn(this.game);
            this.game = newState;
            this.syncState();
        });

        this.onMessage("useUltimate", (client) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            this.game = useUltimate(this.game, playerId);
            this.syncState();
        });

        this.onMessage("manaCharge", (client, message: { indices: number[] }) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            this.game = manaCharge(this.game, playerId, message.indices);
            this.syncState();
        });

        this.onMessage("toggleManaCharge", (client) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            this.game = toggleManaChargeMode(this.game, playerId);
            this.syncState();
        });

        this.onMessage("selectCharge", (client, message: { index: number }) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            this.game = selectCardForCharge(this.game, playerId, message.index);
            this.syncState();
        });

        this.onMessage("discard", (client, message: { cardId: string }) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId || this.game.turnPlayerId !== playerId) return;

            this.game = discardAndDraw(this.game, playerId, message.cardId);
            this.syncState();
        });
        this.onMessage("surrender", (client) => {
            if (!this.game) return;
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId) return;

            // Opponent wins
            const opponentId = this.playerIds.find(id => id !== playerId);
            if (opponentId) {
                this.game.winner = opponentId;
                this.game.phase = 'end';
                this.syncState();
            }
        });

        this.onMessage("rematch", (client) => {
            const playerId = this.clientMap.get(client.sessionId);
            if (!playerId) return;

            this.rematchRequests.add(playerId);

            if (this.rematchRequests.size >= 2) {
                this.resetGame();
                this.rematchRequests.clear();
            }
        });
    }

    private rematchRequests: Set<string> = new Set();

    private resetGame() {
        if (this.playerIds.length !== 2) return;

        const p1Id = this.playerIds[0];
        const p2Id = this.playerIds[1];

        const client1 = this.clients.find(c => this.clientMap.get(c.sessionId) === p1Id);
        const client2 = this.clients.find(c => this.clientMap.get(c.sessionId) === p2Id);

        if (!client1 || !client2) return;

        const p1Data = (client1 as any).initialData;
        const p2Data = (client2 as any).initialData;

        // Swap turns? Or Random? Let's keep P1 starts for now or Random.
        // Actually createInitialState defaults P1.

        this.game = createInitialState(
            this.roomId,
            { id: p1Id, name: p1Data.name, avatarId: p1Data.avatarId, deck: p1Data.deck },
            { id: p2Id, name: p2Data.name, avatarId: p2Data.avatarId, deck: p2Data.deck }
        );
        this.syncState();
        this.broadcast("gameRestarted");
    }

    onJoin(client: Client, options: { playerId: string, name: string, avatarId: string, deck: string[] }) {
        const playerId = options.playerId || client.sessionId;

        // Reconnection handling (simplified)
        const reconnected = this.playerIds.includes(playerId);

        this.clientMap.set(client.sessionId, playerId);

        if (!reconnected) {
            this.playerIds.push(playerId);

            // Store player data temporarily until game starts
            if (!this.state.players.has(playerId)) {
                const p = new PlayerStateSchema();
                p.id = playerId;
                p.name = options.name || "Player";
                p.avatarId = options.avatarId || "warrior_god";
                // Store initial deck temporarily in a way we can retrieve? 
                // Actually `createInitialState` needs deck.
                // We'll attach it to the client object or a private map for now.
                (client as any).initialData = { name: options.name, avatarId: options.avatarId, deck: options.deck || [] };
                this.state.players.set(playerId, p);
            }
        }

        if (this.playerIds.length === 2 && !this.game) {
            this.lock(); // Start game
            const p1Id = this.playerIds[0];
            const p2Id = this.playerIds[1];

            // WE need to retrieve the Client objects to get the data
            const client1 = this.clients.find(c => this.clientMap.get(c.sessionId) === p1Id);
            const client2 = this.clients.find(c => this.clientMap.get(c.sessionId) === p2Id);

            const p1Data = (client1 as any).initialData;
            const p2Data = (client2 as any).initialData;

            this.game = createInitialState(
                this.roomId,
                { id: p1Id, name: p1Data.name, avatarId: p1Data.avatarId, deck: p1Data.deck },
                { id: p2Id, name: p2Data.name, avatarId: p2Data.avatarId, deck: p2Data.deck }
            );
            this.syncState();

            // Broadcast start? The state sync handles it (phase changes from 'draw' to 'main' implicitly or explicit 'draw' phase in engine)
        }
    }

    onLeave(client: Client, consented: boolean) {
        const playerId = this.clientMap.get(client.sessionId);
        // If game in progress, maybe auto-surrender or wait for reconnect?
        // For simplicity, if someone leaves, game over or pause.
        // Current other games destroy room.

        // If game hasn't started, just remove.
        if (!this.game) {
            const idx = this.playerIds.indexOf(playerId || "");
            if (idx !== -1) this.playerIds.splice(idx, 1);
            if (playerId) this.state.players.delete(playerId);
            // Game in progress - Dissolve room
            this.broadcast("roomDissolved", { reason: "Opponent left the game." });

            // Unlock the room
            this.unlock();

            // Delay disconnect slightly to ensure message is sent
            this.clock.setTimeout(() => {
                this.clients.forEach(c => {
                    if (c.sessionId !== client.sessionId) {
                        c.leave();
                    }
                });
            }, 500);
        }
    }

    private syncState() {
        if (!this.game) return;
        const s = this.state;
        const g = this.game;

        s.roomId = g.roomId;
        s.turnPlayerId = g.turnPlayerId;
        s.phase = g.phase;
        s.turnCount = g.turnCount;
        s.winner = g.winner || "";

        // Sync Helper for Array
        const syncArray = <T>(schemaArray: ArraySchema<T>, sourceArray: any[], factory: (item: any) => T) => {
            // Naive full sync: clear and push. Robust and simple for small arrays.
            schemaArray.clear();
            if (sourceArray) {
                sourceArray.forEach(item => schemaArray.push(factory(item)));
            }
        };

        // Sync Helper for String Array
        const syncStringArray = (schemaArray: ArraySchema<string>, sourceArray: string[]) => {
            schemaArray.clear();
            if (sourceArray) {
                sourceArray.forEach(item => schemaArray.push(item));
            }
        };

        const syncNumberArray = (schemaArray: ArraySchema<number>, sourceArray: number[]) => {
            schemaArray.clear();
            if (sourceArray) {
                sourceArray.forEach(item => schemaArray.push(item));
            }
        };

        // Players
        for (const pid in g.players) {
            const pSource = g.players[pid];
            let pSchema = s.players.get(pid);
            if (!pSchema) {
                pSchema = new PlayerStateSchema();
                s.players.set(pid, pSchema);
            }

            pSchema.id = pSource.id;
            pSchema.name = pSource.name;
            pSchema.avatarId = pSource.avatarId;
            pSchema.hp = pSource.hp;
            pSchema.maxHp = pSource.maxHp;
            pSchema.mp = pSource.mp;
            pSchema.maxMp = pSource.maxMp;
            pSchema.status = pSource.status;
            pSchema.money = pSource.money;
            pSchema.ultimateUsed = pSource.ultimateUsed;
            pSchema.isManaChargeMode = !!pSource.isManaChargeMode; // Force boolean

            syncStringArray(pSchema.hand, pSource.hand);
            syncStringArray(pSchema.deck, pSource.deck);
            syncStringArray(pSchema.discardPile, pSource.discardPile);
            syncStringArray(pSchema.manaZone, pSource.manaZone || []);
            syncNumberArray(pSchema.selectedForCharge, pSource.selectedForCharge || []);

            // Equipment
            pSchema.equipment.weapon = pSource.equipment.weapon || "";
            pSchema.equipment.armor = pSource.equipment.armor || "";
            pSchema.equipment.armorDurability = pSource.equipment.armorDurability || 0;
            pSchema.equipment.enchantment = pSource.equipment.enchantment || "";

            // Status Effects
            syncArray(pSchema.statusEffects, pSource.statusEffects, (eff: StatusEffect) => {
                const es = new StatusEffectSchema();
                es.id = eff.id;
                es.type = eff.type;
                es.name = eff.name;
                es.value = eff.value;
                es.duration = eff.duration;
                return es;
            });
        }

        // Log (Optimized: only push new logs)
        // If Schema log length < Game log length, add missing.
        if (s.log.length < g.log.length) {
            for (let i = s.log.length; i < g.log.length; i++) {
                const l = g.log[i];
                const ls = new GameLogEntrySchema();
                ls.id = l.id;
                ls.text = l.text;
                ls.timestamp = l.timestamp;
                s.log.push(ls);
            }
        }

        // Field
        if (g.field) {
            s.field.cardId = g.field.cardId;
            s.field.name = g.field.name;
            s.field.effectId = g.field.effectId;
            s.field.element = g.field.element || "";
        } else {
            s.field.cardId = ""; // mark as empty
        }

        // Traps
        syncArray(s.traps, g.traps || [], (t: Trap) => {
            const ts = new TrapSchema();
            ts.id = t.id;
            ts.cardId = t.cardId;
            ts.name = t.name;
            ts.ownerId = t.ownerId;
            ts.effectId = t.effectId;
            return ts;
        });

        // TurnState
        s.turnState.hasAttacked = g.turnState.hasAttacked;
        s.turnState.hasDiscarded = g.turnState.hasDiscarded;
        s.turnState.cardsPlayedCount = g.turnState.cardsPlayedCount;
        s.turnState.isComboChain = !!g.turnState.isComboChain;
        s.turnState.manaChargeCount = g.turnState.manaChargeCount || 0;
        syncStringArray(s.turnState.freeCardIds, g.turnState.freeCardIds || []);

        // Last Played
        if (g.lastPlayedCard) {
            s.lastPlayedCardId = g.lastPlayedCard.cardId;
            s.lastPlayedPlayerId = g.lastPlayedCard.playerId;
            s.lastPlayedTimestamp = g.lastPlayedCard.timestamp;
        }
    }
}
