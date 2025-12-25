import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class SimpleShogiPiece extends Schema {
    @type("string") type: string; // "king" | "rook" | "bishop" | "pawn" | "gold"
    @type("string") owner: string; // "sente" | "gote"
    @type("string") id: string; // "pawn-1" etc.

    constructor(type: string, owner: string, id: string) {
        super();
        this.type = type;
        this.owner = owner;
        this.id = id;
    }
}

export class SimpleShogiPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") role: string; // "sente" | "gote" | "spectator"

    constructor(id: string, name: string, role: string) {
        super();
        this.id = id;
        this.name = name;
        this.role = role;
    }
}

export class SimpleShogiState extends Schema {
    @type({ map: SimpleShogiPlayer }) players = new MapSchema<SimpleShogiPlayer>();

    // Board is 1D array of 12 cells (3x4)
    // Index = row * 3 + col
    // R0 (Top) -> R3 (Bottom)
    @type([SimpleShogiPiece]) board = new ArraySchema<SimpleShogiPiece>();

    // Hands
    @type([SimpleShogiPiece]) senteHand = new ArraySchema<SimpleShogiPiece>();
    @type([SimpleShogiPiece]) goteHand = new ArraySchema<SimpleShogiPiece>();

    @type("string") turn = "sente";
    @type("string") winner = ""; // "sente" | "gote" | "draw" | ""
    @type("boolean") gameStarted = false;
    @type("boolean") isDraw = false;

    // Latest move info for highlighting (optional but good)
    @type("number") lastMoveFrom = -1; // -1 if drop
    @type("number") lastMoveTo = -1;
}
