import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class MancalaPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") role: string; // "first" | "second"
}

export class MancalaState extends Schema {
    @type(["number"]) board = new ArraySchema<number>();
    @type("string") turn: string = "first";
    @type("string") winner: string = ""; // "" | "first" | "second" | "draw"
    @type("boolean") isGameOver: boolean = false;
    @type("boolean") gameStarted: boolean = false;
    @type({ map: MancalaPlayer }) players = new MapSchema<MancalaPlayer>();

    constructor() {
        super();
        // Initialize board with 14 pits
        for (let i = 0; i < 14; i++) {
            if (i === 6 || i === 13) {
                this.board.push(0);
            } else {
                this.board.push(4);
            }
        }
    }
}
