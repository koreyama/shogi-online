import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "Guest";
    @type("number") score: number = 0;
}

export class DotsAndBoxesState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();

    // Game Board Dimensions
    @type("number") rows: number = 6;
    @type("number") cols: number = 6;

    // Game State
    @type("number") currentPlayer: number = 1; // 1 or 2
    @type("number") winner: number = 0; // 0: playing, 1: P1, 2: P2, 3: Draw
    @type("boolean") gameStarted: boolean = false;

    // Board Data (Flattened for Colyseus efficiency)
    // hLines: (ROWS) x (COLS-1)
    // vLines: (ROWS-1) x (COLS)
    // boxes:  (ROWS-1) x (COLS-1)
    @type(["boolean"]) hLines = new ArraySchema<boolean>();
    @type(["boolean"]) vLines = new ArraySchema<boolean>();
    @type(["number"]) boxes = new ArraySchema<number>();

    constructor(rows: number = 6, cols: number = 6) {
        super();
        this.rows = rows;
        this.cols = cols;

        // Initialize Arrays
        // Horizontal Lines: rows * (cols - 1)
        for (let i = 0; i < rows * (cols - 1); i++) {
            this.hLines.push(false);
        }

        // Vertical Lines: (rows - 1) * cols
        for (let i = 0; i < (rows - 1) * cols; i++) {
            this.vLines.push(false);
        }

        // Boxes: (rows - 1) * (cols - 1)
        for (let i = 0; i < (rows - 1) * (cols - 1); i++) {
            this.boxes.push(0); // 0: No Owner
        }
    }
}
