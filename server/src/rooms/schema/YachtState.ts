import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string = "";
    @type("string") playerId: string = "";
    @type("string") name: string = "Guest";
    @type("string") role: string = ""; // P1 or P2
}

export class YachtState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();

    @type(["number"]) dice = new ArraySchema<number>(1, 1, 1, 1, 1);
    @type(["boolean"]) held = new ArraySchema<boolean>(false, false, false, false, false);
    @type("number") rollsLeft = 3;

    @type({ map: "number" }) scoresP1 = new MapSchema<number>();
    @type({ map: "number" }) scoresP2 = new MapSchema<number>();

    @type("string") turn = "P1";
    @type("boolean") isRolling = false;
    @type("string") winner = ""; // P1, P2, Draw
    @type("boolean") gameStarted = false;
}
