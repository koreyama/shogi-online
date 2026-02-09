import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class SudokuPlayer extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("boolean") isReady: boolean = false;
    @type("string") status: string = "waiting"; // waiting, playing, finished
    @type("number") progress: number = 0; // 0-100%
    @type("number") finishTime: number = 0;

    // Player's puzzle (81 cells: 0 = empty, 1-9 = clue)
    @type(["number"]) puzzle = new ArraySchema<number>();

    // Player's solution (for validation)
    @type(["number"]) solution = new ArraySchema<number>();

    // Player's current board state (what they've filled in)
    @type(["number"]) boardValues = new ArraySchema<number>();
}

export class SudokuState extends Schema {
    @type("string") status: string = "waiting"; // waiting, playing, finished
    @type("number") startTime: number = 0;
    @type("string") difficulty: string = "EASY";
    @type("string") winnerId: string = "";

    @type({ map: SudokuPlayer }) players = new MapSchema<SudokuPlayer>();
}
