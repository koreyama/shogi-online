import { Schema, MapSchema, type } from "@colyseus/schema";

export class DrawingPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("number") score: number = 0;
    @type("boolean") isDrawer: boolean = false;
    @type("boolean") isOnline: boolean = true;

    constructor(id: string = "", name: string = "") {
        super();
        this.id = id;
        this.name = name;
    }
}

export class DrawingState extends Schema {
    @type({ map: DrawingPlayer }) players = new MapSchema<DrawingPlayer>();
    @type("string") currentDrawer: string = "";
    @type("string") currentWord: string = ""; // Send masked to guessers manually if needed, or handle masking in client
    @type("string") phase: 'lobby' | 'selecting' | 'drawing' | 'result' = 'lobby';
    @type("number") timeLeft: number = 0;
    @type("number") round: number = 1;
    @type("number") maxRounds: number = 3;
}
