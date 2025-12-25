import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class CheckersPiece extends Schema {
    @type("string") type: string = "man"; // "man" | "king"
    @type("string") owner: string = "";   // "red" | "black"
}

export class CheckersPlayer extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") role: string = ""; // "red" | "black"
}

export class CheckersState extends Schema {
    @type({ map: CheckersPiece }) board = new MapSchema<CheckersPiece>();
    @type("string") turn: string = "red";
    @type("string") winner: string = ""; // "" | "red" | "black" | "draw"
    @type("boolean") gameStarted: boolean = false;
    @type({ map: CheckersPlayer }) players = new MapSchema<CheckersPlayer>();
    @type("boolean") mustJump: boolean = false;
    @type("string") activePiece: string = ""; // JSON of {r, c} or empty
}
