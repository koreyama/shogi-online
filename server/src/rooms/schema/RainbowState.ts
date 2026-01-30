import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Card extends Schema {
    @type("string") color: string = ""; // red, blue, green, yellow, black
    @type("string") value: string = ""; // 0-9, skip, reverse, draw2, wild, wild4
    @type("string") type: string = ""; // number, action, wild
}

export class Player extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") sessionId: string = "";
    @type("number") seatIndex: number = 0;
    @type([Card]) hand = new ArraySchema<Card>();
    @type("boolean") hasDrawn: boolean = false; // Track if player drew this turn
    @type("number") rank: number = 0; // 0: playing, 1: winner, etc.
    @type("boolean") isHost: boolean = false;
}

export class RainbowState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type("string") currentTurn: string = ""; // sessionId
    @type("number") direction: number = 1; // 1: clockwise, -1: counter-clockwise
    @type([Card]) drawPile = new ArraySchema<Card>();
    @type([Card]) discardPile = new ArraySchema<Card>();
    @type("string") currentColor: string = ""; // Current active color (for wild handling)

    @type("string") status: string = "waiting"; // waiting, playing, finished
    @type("string") winner: string = ""; // winner sessionId

    @type("number") drawStack: number = 0; // Accumulated draw count (for +2/+4 stacking if we implement it)
}
