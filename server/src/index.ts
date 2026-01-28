import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
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

const httpServer = createServer(); // Don't attach app here yet

const gameServer = new Server({
    transport: new WebSocketTransport({
        server: httpServer,
        maxPayload: 10 * 1024 * 1024 // 10MB max payload
    })
});

// Attach Express to stats/monitor/other routes
gameServer.attach({ server: httpServer }); // Ensure transport listeners are attached (implicit in new Server but good to be safe if strictly separated?)
// Actually new Server() with transport already sets it up. 
// Just need to ensure app runs AFTER.


// Define Rooms
import { DaifugoRoom } from "./rooms/DaifugoRoom";
import { MinesweeperRoom } from "./rooms/MinesweeperRoom";

gameServer.define("dots_and_boxes", DotsAndBoxesRoom);
gameServer.define("shogi", ShogiRoom)
    .filterBy(['mode']);
gameServer.define("chess", ChessRoom)
    .filterBy(['mode']);
gameServer.define("reversi", ReversiRoom)
    .filterBy(['mode']);
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

import { EshiritoriRoom } from "./rooms/EshiritoriRoom";
gameServer.define("eshiritori", EshiritoriRoom);

import { WerewolfRoom } from "./rooms/WerewolfRoom";
gameServer.define("werewolf", WerewolfRoom)
    .filterBy(['mode']);

import { BackgammonRoom } from "./rooms/BackgammonRoom";
gameServer.define("backgammon", BackgammonRoom);

import { MahjongRoom } from "./rooms/MahjongRoom";
import { GoRoom } from "./rooms/GoRoom";
gameServer.define("mahjong", MahjongRoom);
gameServer.define("mahjong3", MahjongRoom); // 3人麻雀用
gameServer.define("go", GoRoom);

import { TicTacToeRoom } from "./rooms/TicTacToeRoom";
gameServer.define("tictactoe", TicTacToeRoom);

import { StatsRoom } from "./rooms/StatsRoom";
gameServer.define("stats", StatsRoom);

import { BilliardsRoom } from "./rooms/BilliardsRoom";
gameServer.define("billiards", BilliardsRoom);

import { LobbyRoom } from "./rooms/LobbyRoom";
gameServer.define("lobby", LobbyRoom);
console.log("Registered LobbyRoom");

gameServer.listen(port);

// Attach Express AFTER Colyseus to ensure /matchmake routes are handled by Colyseus first
httpServer.on("request", app);

console.log(`Listening on ws://localhost:${port}`);
