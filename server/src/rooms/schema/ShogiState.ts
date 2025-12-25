import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Piece, PieceType, Player } from "../../logic/types";

export class ShogiPiece extends Schema {
    @type("string") type: string = "";
    @type("string") owner: string = "";
    @type("boolean") isPromoted: boolean = false;
    @type("string") id: string = "";
}

export class ShogiPlayer extends Schema {
    @type("string") id: string = ""; // sessionId
    @type("string") name: string = "";
    @type("string") role: string = ""; // 'sente' or 'gote'
}

export class ShogiState extends Schema {
    @type({ map: ShogiPlayer }) players = new MapSchema<ShogiPlayer>();

    // Board: 1D Array of (Piece | null). Empty string for null for simpler schema?
    // Or ArraySchema<ShogiPiece> where we handle nulls carefully.
    // Actually, ArraySchema doesn't support nulls well in older versions, but let's try.
    // Index = y * 9 + x
    @type([ShogiPiece]) board = new ArraySchema<ShogiPiece>(); // 81 elements

    @type("string") turn: string = "sente";

    // Hands
    @type([ShogiPiece]) handSente = new ArraySchema<ShogiPiece>();
    @type([ShogiPiece]) handGote = new ArraySchema<ShogiPiece>();

    @type("boolean") gameStarted: boolean = false;
    @type("string") winner: string = ""; // "" or "sente" or "gote"
    @type("boolean") isCheck: boolean = false;

    // History (Optional, for undo/replay)
    // @type([ "string" ]) moveHistory = new ArraySchema<string>(); 

    constructor() {
        super();
        // Initialize empty board
        for (let i = 0; i < 81; i++) {
            this.board.push(new ShogiPiece()); // internal representation of "empty"?
            // Or maybe just leave it empty and map index?
            // Better: use a special "Empty" piece or keep it simple.
            // Let's use filter/map on client.
        }
    }
}
