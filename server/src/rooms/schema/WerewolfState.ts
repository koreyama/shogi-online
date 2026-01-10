import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";

export class WerewolfPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") role: string = "villager"; // villager, werewolf, seer, medium, bodyguard, madman
    @type("boolean") isAlive: boolean = true;
    @type("boolean") isHost: boolean = false;
    @type("boolean") isReady: boolean = false;
    @type("string") votedFor: string = ""; // ID of the player voted for
    @type("boolean") protected: boolean = false; // Protected by bodyguard
    @type("boolean") checked: boolean = false; // Checked by seer (for result display)
    @type("boolean") wantsToSkip: boolean = false; // Vote to skip discussion

    constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }
}

export class ChatMessage extends Schema {
    @type("string") id: string;
    @type("string") senderId: string;
    @type("string") senderName: string;
    @type("string") content: string;
    @type("string") type: string; // normal, system, werewolf, dead, gm
    @type("number") timestamp: number;

    constructor(senderId: string, senderName: string, content: string, type: string = "normal") {
        super();
        this.id = Math.random().toString(36).substr(2, 9);
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.type = type;
        this.timestamp = Date.now();
    }
}

export class GameSettings extends Schema {
    @type("number") discussionTime: number = 240; // Seconds
    @type("number") nightTime: number = 60; // Seconds

    // Role counts
    @type("number") villagerCount: number = 1;
    @type("number") werewolfCount: number = 2; // Default for typical 5+ player game
    @type("number") seerCount: number = 1;
    @type("number") mediumCount: number = 0;
    @type("number") bodyguardCount: number = 0;
    @type("number") madmanCount: number = 0;
    @type("boolean") canFirstNightAttack: boolean = true;
}

export class WerewolfState extends Schema {
    @type("string") phase: string = "lobby";
    // lobby, role_assign, day_conversation, day_vote, day_execution, night_action, result

    @type("number") dayCount: number = 0;
    @type("number") timeLeft: number = 0;

    @type({ map: WerewolfPlayer }) players = new MapSchema<WerewolfPlayer>();
    @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();

    @type(GameSettings) settings = new GameSettings();

    @type("string") winner: string = ""; // "villagers" or "werewolves"

    @type("string") executedPlayerId: string = "";
    @type("string") victimPlayerId: string = "";
}
