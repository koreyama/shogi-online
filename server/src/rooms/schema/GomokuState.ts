import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";

export class GomokuPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") color: string; // "black" | "white"

    constructor(id: string, name: string, color: string) {
        super();
        this.id = id;
        this.name = name;
        this.color = color;
    }
}

export class GomokuState extends Schema {
    @type({ map: GomokuPlayer }) players = new MapSchema<GomokuPlayer>();
    @type(["number"]) board = new ArraySchema<number>(); // 0=Empty, 1=Black, 2=White. 15x15=225
    @type("string") turn: string = "black";
    @type("string") winner: string = "";
    @type("boolean") isGameOver: boolean = false;
    @type("string") lastMove: string = ""; // e.g., "h8"

    constructor() {
        super();
        // Initialize 15x15 board with 0
        for (let i = 0; i < 225; i++) {
            this.board.push(0);
        }
    }
}
