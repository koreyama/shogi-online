import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Card extends Schema {
    @type("string") suit: string = "";
    @type("string") rank: string = "";
}

export class GameEvent extends Schema {
    @type("string") type: string = ""; // '8cut', 'revolution', 'rank', 'miyakoochi', etc.
    @type("string") message: string = "";
    @type("string") playerId: string = ""; // Which player triggered this event
    @type("number") timestamp: number = 0;
}

export class Player extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") role: string = ""; // 'host' | 'guest'
    @type("boolean") isReady: boolean = false;
    @type("boolean") isAi: boolean = false;
    @type([Card]) hand = new ArraySchema<Card>();
    @type("string") rank: string = ""; // 'daifugo', 'fugo', etc.
    @type("number") score: number = 0;
    @type("number") lastScoreChange: number = 0;
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

    // Rules (synced for client visibility)
    @type("boolean") ruleRevolution: boolean = true;
    @type("boolean") rule8Cut: boolean = true;
    @type("boolean") rule11Back: boolean = true;
    @type("boolean") ruleMiyakoOchi: boolean = true;
    @type("boolean") ruleSpade3: boolean = false;
    @type("number") jokerCount: number = 2;

    // Local Rules
    @type("boolean") rule5Skip: boolean = false; // 5 Skip
    @type("boolean") rule7Watashi: boolean = false; // 7 Pass
    @type("boolean") ruleQBomber: boolean = false; // Q Bomber

    // Finished Players (Order of finish)
    @type(["string"]) finishedPlayers = new ArraySchema<string>();

    @type("string") status: string = "waiting"; // 'waiting', 'playing', 'finished', 'exchanging'
    @type("string") winner: string = ""; // ID of first place

    // Interaction State (for 7 Watashi / Q Bomber / 10 Sute)
    @type("string") pendingAction: string = ""; // '7watashi' | 'qbomber' | '10sute' | ''
    @type("string") pendingActionPlayerId: string = "";
    @type("number") pendingActionCount: number = 0; // Number of cards to pass/discard

    // Event Sync
    @type(GameEvent) lastEvent = new GameEvent();

    // Card Exchange State
    @type({ map: "number" }) exchangePending = new MapSchema<number>();

    @type("boolean") rule10Sute: boolean = false;

    // Miyako-ochi state
    @type("string") droppedDaifugoId: string = "";
}
