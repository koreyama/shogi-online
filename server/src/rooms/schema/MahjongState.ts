import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class MahjongTile extends Schema {
    @type("string") id: string = "";
    @type("string") suit: string = ""; // man, pin, sou, honor
    @type("number") value: number = 0;
    @type("boolean") isRed: boolean = false;
}

export class MahjongCall extends Schema {
    @type("string") callType: string = ""; // chi, pon, kan, ankan, kakan
    @type([MahjongTile]) tiles = new ArraySchema<MahjongTile>();
    @type("number") fromPlayer: number = -1;
}

export class MahjongPlayer extends Schema {
    @type("string") sessionId: string = "";
    @type("string") name: string = "";
    @type("number") seatIndex: number = -1; // 0=東, 1=南, 2=西, 3=北
    @type("string") wind: string = ""; // east, south, west, north
    @type("number") score: number = 25000;
    @type("boolean") isRiichi: boolean = false;
    @type("boolean") isIppatsu: boolean = false;
    @type("boolean") isCpu: boolean = false;
    @type("boolean") isConnected: boolean = true;
    @type([MahjongTile]) hand = new ArraySchema<MahjongTile>();
    @type([MahjongTile]) discards = new ArraySchema<MahjongTile>();
    @type([MahjongCall]) calls = new ArraySchema<MahjongCall>();
}

export class MahjongState extends Schema {
    @type("string") phase: string = "waiting"; // waiting, playing, calling, finished, draw
    @type({ map: MahjongPlayer }) players = new MapSchema<MahjongPlayer>();
    @type([MahjongTile]) doraIndicators = new ArraySchema<MahjongTile>();
    @type("number") currentPlayerIndex: number = 0;
    @type("string") roundWind: string = "east";
    @type("number") roundNumber: number = 1;
    @type("number") honba: number = 0;
    @type("number") riichiSticks: number = 0;
    @type("number") remainingTiles: number = 0;
    @type("number") turnCount: number = 0;
    @type("string") lastAction: string = "";
    @type("number") winner: number = -1;
    @type("string") winnerName: string = "";
    @type("number") winningScore: number = 0;
    @type("string") winningYaku: string = "";
    @type("boolean") isGameOver: boolean = false;
    @type("number") minPlayers: number = 3; // 3-4人対応
    @type("number") maxPlayers: number = 4;

    // For call opportunities
    @type([MahjongTile]) lastDiscard = new ArraySchema<MahjongTile>();
    @type("number") lastDiscardPlayer: number = -1;
    @type(["boolean"]) canRon = new ArraySchema<boolean>();
    @type(["boolean"]) canCall = new ArraySchema<boolean>();
}
