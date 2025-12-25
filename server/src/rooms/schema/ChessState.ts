import { Schema, type, MapSchema } from "@colyseus/schema";

export class ChessPlayer extends Schema {
    @type("string") id: string = ""; // sessionId
    @type("string") name: string = "";
    @type("string") color: string = ""; // 'w' or 'b'
}

export class ChessState extends Schema {
    @type({ map: ChessPlayer }) players = new MapSchema<ChessPlayer>();

    // FEN string represents the entire board state
    @type("string") fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    @type("string") turn: string = "w"; // 'w' or 'b'

    // Game result
    @type("string") winner: string = ""; // "w", "b", "draw", or ""

    @type("boolean") isGameOver: boolean = false;

    // Last move for highlighting (optional but useful) e.g. { from: "e2", to: "e4" }
    // Serialized as generic object or string
    @type("string") lastMove: string = "";

    @type("boolean") isCheck: boolean = false;
}
