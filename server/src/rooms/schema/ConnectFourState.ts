import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class ConnectFourPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") role: string; // "red" or "yellow"

    constructor(id: string, name: string, role: string) {
        super();
        this.id = id;
        this.name = name;
        this.role = role;
    }
}

export class ConnectFourState extends Schema {
    @type({ map: ConnectFourPlayer }) players = new MapSchema<ConnectFourPlayer>();
    @type(["number"]) board = new ArraySchema<number>(); // 0=Empty, 1=Red, 2=Yellow. Size 42 (7x6)
    @type("string") turn: string = "red";
    @type("string") winner: string = "";
    @type("boolean") gameStarted: boolean = false;
    @type("boolean") isDraw: boolean = false;
    @type("number") lastMoveCol: number = -1;
    @type("number") lastMoveRow: number = -1;

    constructor() {
        super();
        // Initialize 7x6 board (42 cells)
        for (let i = 0; i < 42; i++) {
            this.board.push(0);
        }
    }
}
