import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class GoPlayer extends Schema {
    @type("string") sessionId: string = "";
    @type("string") name: string = "";
    @type("string") color: string = ""; // "black" or "white"
    @type("boolean") connected: boolean = true;
    @type("number") captured: number = 0;
}

export class GoState extends Schema {
    @type({ map: GoPlayer }) players = new MapSchema<GoPlayer>();
    @type("string") currentPlayerId: string = "";
    @type("string") turnColor: string = "black";
    @type("number") boardSize: number = 19;

    // Flattened grid for synchronization efficiency
    // "black", "white", or "" (empty)
    @type(["string"]) grid = new ArraySchema<string>();

    @type("string") phase: string = "waiting"; // waiting, playing, finished
    @type("string") winner: string = "";
    @type("string") reason: string = "";

    @type("number") blackTime: number = 600;
    @type("number") whiteTime: number = 600;
}
