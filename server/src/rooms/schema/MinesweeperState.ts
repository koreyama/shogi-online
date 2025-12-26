import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class MinesweeperPlayer extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("boolean") isReady: boolean = false;
    @type("string") status: string = "waiting"; // waiting, playing, frozen, won, lost
    @type("number") progress: number = 0; // 0-100%
    @type("number") finishTime: number = 0;

    // Player's board state (masks)
    // 0: Hidden, 1: Revealed, 2: Flagged
    @type(["number"]) cellStates = new ArraySchema<number>();

    // Independent Board for this player
    @type(["number"]) mines = new ArraySchema<number>();
}

export class MinesweeperState extends Schema {
    @type("string") status: string = "waiting"; // waiting, playing, finished
    @type("number") startTime: number = 0;

    // Board Config (Global Settings)
    @type("number") width: number = 9;
    @type("number") height: number = 9;
    @type("number") mineCount: number = 10;

    @type({ map: MinesweeperPlayer }) players = new MapSchema<MinesweeperPlayer>();
}
