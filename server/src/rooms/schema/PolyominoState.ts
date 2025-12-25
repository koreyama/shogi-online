import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class PolyominoPiece extends Schema {
    @type("string") id: string;
    @type("number") value: number;
    // We don't necessarily need to sync the whole shape if client knows it by ID,
    // but for authoritative validation we keep it on server.
}

export class PolyominoPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") role: string; // "P1" or "P2"
    @type([PolyominoPiece]) hand = new ArraySchema<PolyominoPiece>();
    @type("number") score: number = 0;
    @type("boolean") hasNoMoves: boolean = false;
}

export class PolyominoState extends Schema {
    @type(["string"]) board = new ArraySchema<string>(); // 14x14 = 196 elements. "P1", "P2" or ""
    @type("string") turn: string = "P1";
    @type("string") winner: string = "";
    @type("boolean") isGameOver: boolean = false;
    @type("boolean") gameStarted: boolean = false;
    @type({ map: PolyominoPlayer }) players = new MapSchema<PolyominoPlayer>();
    @type("string") statusMessage: string = "";

    constructor() {
        super();
        // Initialize 14x14 empty board
        for (let i = 0; i < 14 * 14; i++) {
            this.board.push("");
        }
    }
}
