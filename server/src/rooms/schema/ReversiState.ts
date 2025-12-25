import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";

export class ReversiPlayer extends Schema {
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

export class ReversiState extends Schema {
    @type({ map: ReversiPlayer }) players = new MapSchema<ReversiPlayer>();
    @type(["number"]) board = new ArraySchema<number>(); // 0=Empty, 1=Black, 2=White. 8x8=64
    @type("string") turn: string = "black";
    @type("string") winner: string = "";
    @type("boolean") isGameOver: boolean = false;
    @type("number") blackCount: number = 2;
    @type("number") whiteCount: number = 2;
    @type("string") lastMove: string = ""; // e.g. "c4" or "pass"

    constructor() {
        super();
        // Initialize 8x8 board with 0
        for (let i = 0; i < 64; i++) {
            this.board.push(0);
        }
        // Initial setup
        // 3,3 (d4) -> White(2)
        // 4,4 (e5) -> White(2)
        // 3,4 (d5) -> Black(1)
        // 4,3 (e4) -> Black(1)
        // Index = y * 8 + x
        this.board[3 * 8 + 3] = 2;
        this.board[4 * 8 + 4] = 2;
        this.board[3 * 8 + 4] = 1;
        this.board[4 * 8 + 3] = 1;
    }
}
