import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { monitor } from "@colyseus/monitor";

import { DotsAndBoxesRoom } from "./rooms/DotsAndBoxesRoom";
import { ShogiRoom } from "./rooms/ShogiRoom";
import { ChessRoom } from "./rooms/ChessRoom";
import { ReversiRoom } from "./rooms/ReversiRoom";
import { GomokuRoom } from "./rooms/GomokuRoom";
import { ConnectFourRoom } from "./rooms/ConnectFourRoom";
import { SimpleShogiRoom } from "./rooms/SimpleShogiRoom";
import { HoneycombRoom } from "./rooms/HoneycombRoom";
import { CheckersRoom } from "./rooms/CheckersRoom";
import { MancalaRoom } from "./rooms/MancalaRoom";
import { PolyominoRoom } from "./rooms/PolyominoRoom";
import { HitBlowRoom } from "./rooms/HitBlowRoom";
import { YachtRoom } from "./rooms/YachtRoom";
import { CardGameRoom } from "./rooms/CardGameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Main Route
app.get("/", (req, res) => {
    res.send("It works! Colyseus Server for Shogi Online.");
});

// Colyseus Monitor
app.use("/colyseus", monitor());

const gameServer = new Server({
    server: createServer(app),
});

// Define Rooms
import { DaifugoRoom } from "./rooms/DaifugoRoom";
import { MinesweeperRoom } from "./rooms/MinesweeperRoom";

gameServer.define("dots_and_boxes", DotsAndBoxesRoom);
gameServer.define("shogi", ShogiRoom);
gameServer.define("chess", ChessRoom);
gameServer.define("reversi", ReversiRoom);
gameServer.define("gomoku", GomokuRoom);
gameServer.define("connectfour", ConnectFourRoom);
gameServer.define("simpleshogi", SimpleShogiRoom);
gameServer.define("honeycomb", HoneycombRoom);
gameServer.define("checkers", CheckersRoom);
gameServer.define("mancala", MancalaRoom);
gameServer.define("polyomino", PolyominoRoom);
gameServer.define("hitblow", HitBlowRoom);
gameServer.define("yacht", YachtRoom);
gameServer.define("card_game", CardGameRoom)
    .filterBy(['mode']);
gameServer.define("daifugo_room", DaifugoRoom);
gameServer.define("minesweeper_room", MinesweeperRoom)
    .filterBy(['difficulty']);

import { DrawingRoom } from "./rooms/DrawingRoom";
gameServer.define("drawing", DrawingRoom);

import { BackgammonRoom } from "./rooms/BackgammonRoom";
gameServer.define("backgammon", BackgammonRoom);

import { MahjongRoom } from "./rooms/MahjongRoom";
import { GoRoom } from "./rooms/GoRoom";
gameServer.define("mahjong", MahjongRoom);
gameServer.define("mahjong3", MahjongRoom); // 3人麻雀用
gameServer.define("go", GoRoom);

import { StatsRoom } from "./rooms/StatsRoom";
gameServer.define("stats", StatsRoom);

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
