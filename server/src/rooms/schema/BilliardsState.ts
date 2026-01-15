import { Schema, MapSchema, type } from "@colyseus/schema";

export class Ball extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") id: number = 0;
    @type("number") type: number = 0; // 0=Cue, 1=Solid, 2=Stripe, 3=Black
    @type("boolean") visible: boolean = true;
}

export class BilliardsState extends Schema {
    @type({ map: Ball }) balls = new MapSchema<Ball>();
    @type("string") currentTurn: string = "";
    @type("string") status: string = "waiting"; // waiting, playing, placing, ended, disconnected
    @type("string") winner: string = "";
    @type("boolean") moving: boolean = false;
    @type("boolean") placingCueBall: boolean = false;
    @type("string") foulMessage: string = "";
    @type("string") player1Id: string = "";
    @type("string") player2Id: string = "";
    @type("string") player1Name: string = ""; // Player 1's display name
    @type("string") player2Name: string = ""; // Player 2's display name
    @type("string") player1Type: string = "";
    @type("string") player2Type: string = "";
    @type("number") timestamp: number = 0;
}
