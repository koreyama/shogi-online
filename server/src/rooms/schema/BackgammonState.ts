import { Schema, type, ArraySchema } from "@colyseus/schema";

export class Point extends Schema {
    @type("number") count: number = 0;
    @type("number") color: number = 0; // 0: None, 1: White, 2: Black
}

export class Bar extends Schema {
    @type("number") white: number = 0;
    @type("number") black: number = 0;
}

export class Off extends Schema {
    @type("number") white: number = 0;
    @type("number") black: number = 0;
}

export class BackgammonState extends Schema {
    @type([Point]) board = new ArraySchema<Point>();
    @type(Bar) bar = new Bar();
    @type(Off) off = new Off();
    @type(["number"]) dice = new ArraySchema<number>();
    @type("number") turn: number = 1; // 1: White, 2: Black
    @type("string") winner: string = "";
    @type(["number"]) validMoves = new ArraySchema<number>(); // For client hint (optional)

    // Player IDs
    @type("string") whitePlayerId: string = "";
    @type("string") blackPlayerId: string = "";

    // Player Names
    @type("string") whitePlayerName: string = "";
    @type("string") blackPlayerName: string = "";

    constructor() {
        super();
        // Initialize 24 points
        for (let i = 0; i < 24; i++) {
            this.board.push(new Point());
        }
        this.setupBoard();
    }

    setupBoard() {
        // Standard Setup
        // Point 0 is player 1's home inner table (bottom right maybe? dependent on viewing angle)
        // Let's use standard notation indices 0-23.
        // 1 = White, 2 = Black
        // White moves 23 -> 0
        // Black moves 0 -> 23

        // White pieces
        this.setPoint(0, 2, 2);   // Black: 2 on 24-point (index 0 if viewing from white perspective? Let's standardize)
        // Let's standardize: Points 0-23.
        // White Home Board: 0-5. White Outer: 6-11. Black Outer: 12-17. Black Home: 18-23.
        // White moves 23 -> 0. Black moves 0 -> 23.
        // OR
        // Standard setup:
        // White: 2 on 24, 5 on 13, 3 on 8, 5 on 6. 
        // INDICES:
        // If White moves Higher -> Lower (24 -> 1):
        // 24 (idx 23) has 2 Black? No, usually opponents start in each other's home.

        // Let's use:
        // 0-23 indices.
        // White Home: 0-5.
        // White Direction: 23 -> 0.
        // Black Direction: 0 -> 23.

        // Setup for White (1)
        this.setPoint(5, 5, 1);   // 5 on 6-point
        this.setPoint(7, 3, 1);   // 3 on 8-point
        this.setPoint(12, 5, 1);  // 5 on 13-point
        this.setPoint(23, 2, 1);  // 2 on 24-point

        // Setup for Black (2)
        this.setPoint(0, 2, 2);   // 2 on 1-point
        this.setPoint(11, 5, 2);  // 5 on 12-point
        this.setPoint(16, 3, 2);  // 3 on 17-point
        this.setPoint(18, 5, 2);  // 5 on 19-point
    }

    setPoint(index: number, count: number, color: number) {
        this.board[index].count = count;
        this.board[index].color = color;
    }
}
