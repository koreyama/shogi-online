import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class HoneycombPlayer extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("number") role: number = 0;
}

export class HoneycombState extends Schema {
    @type({ map: "number" }) board = new MapSchema<number>();
    @type("number") turn: number = 1;
    @type("number") winner: number = 0;
    @type(["string"]) winningLine = new ArraySchema<string>();
    @type({ map: HoneycombPlayer }) players = new MapSchema<HoneycombPlayer>();
    @type("boolean") gameStarted: boolean = false;
    @type("string") winReason: string = "";
}
