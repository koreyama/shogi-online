import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Card extends Schema {
    @type("string") suit: string = "";
    @type("string") rank: string = "";
}

export class Player extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") role: string = ""; // 'host' | 'guest'
    @type("boolean") isReady: boolean = false;
    @type("boolean") isAi: boolean = false;
    @type([Card]) hand = new ArraySchema<Card>();
    @type("string") rank: string = ""; // 'daifugo', 'fugo', etc.
}

export class DaifugoState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type("string") turnPlayerId: string = "";
    @type([Card]) fieldCards = new ArraySchema<Card>();

    // Last Move
    @type("string") lastMovePlayerId: string = "";
    @type([Card]) lastMoveCards = new ArraySchema<Card>();

    @type("number") passCount: number = 0;
    @type("boolean") isRevolution: boolean = false;
    @type("boolean") is11Back: boolean = false;
    @type("boolean") isShibari: boolean = false;

    // Rules (synced for client visibility)
    @type("boolean") ruleRevolution: boolean = true;
    @type("boolean") rule8Cut: boolean = true;
    @type("boolean") rule11Back: boolean = true;
    @type("boolean") ruleMiyakoOchi: boolean = true;
    @type("boolean") ruleStaircase: boolean = false;
    @type("boolean") ruleShibari: boolean = false;
    @type("boolean") ruleSpade3: boolean = false;
    @type("number") jokerCount: number = 2; // Added jokerCount

    // Finished Players (Order of finish)
    @type(["string"]) finishedPlayers = new ArraySchema<string>();

    @type("string") status: string = "waiting"; // 'waiting', 'playing', 'finished', 'exchanging'
    @type("string") winner: string = ""; // ID of first place

    // Exchange Logic
    // Map of PlayerID -> Number of cards strictly needed to give
    // If > 0, player must select cards to give.
    @type({ map: "number" }) exchangePending = new MapSchema<number>();
}
