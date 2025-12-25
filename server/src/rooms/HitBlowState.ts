import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class GuessResult extends Schema {
    @type("number") hit: number = 0;
    @type("number") blow: number = 0;
}

export class GuessRecord extends Schema {
    @type("string") guess: string = "";
    @type(GuessResult) result: GuessResult = new GuessResult();
    @type("string") player: string = ""; // "P1" or "P2"
    @type("number") timestamp: number = 0;
}

export class Player extends Schema {
    @type("string") name: string = "";
    @type("string") role: string = ""; // "P1" or "P2"
}

export class HitBlowState extends Schema {
    @type("string") secret: string = "";
    @type("string") turn: string = "P1";
    @type("boolean") isGameOver: boolean = false;
    @type("string") winner: string = "";
    @type("boolean") gameStarted: boolean = false;
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([GuessRecord]) history = new ArraySchema<GuessRecord>();
    @type("boolean") allowDuplicates: boolean = false;
    @type("string") statusMessage: string = "";
}
