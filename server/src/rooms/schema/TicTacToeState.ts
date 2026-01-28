import { Schema, Context, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class TicTacToeMove extends Schema {
    @type("number") index: number;
    @type("string") mark: string;
    constructor(index: number, mark: string) {
        super();
        this.index = index;
        this.mark = mark;
    }
}

export class TicTacToePlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") mark: string; // "o" or "x"

    constructor(id: string, name: string, mark: string) {
        super();
        this.id = id;
        this.name = name;
        this.mark = mark;
    }
}

export class TicTacToeState extends Schema {
    @type({ map: TicTacToePlayer }) players = new MapSchema<TicTacToePlayer>();
    @type(["number"]) board = new ArraySchema<number>(0, 0, 0, 0, 0, 0, 0, 0, 0); // 0=empty, 1=o, 2=x
    @type([TicTacToeMove]) moves = new ArraySchema<TicTacToeMove>();
    @type("string") turn = "o"; // "o" or "x"
    @type("string") winner = ""; // "o", "x", "draw", or ""
    @type("boolean") isGameOver = false;
    @type("string") lastMove = ""; // For logging/history if needed
}
