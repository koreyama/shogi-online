import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { monitor } from "@colyseus/monitor";

import { DotsAndBoxesRoom } from "./rooms/DotsAndBoxesRoom";
import { ShogiRoom } from "./rooms/ShogiRoom";

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
gameServer.define("dots_and_boxes", DotsAndBoxesRoom);
gameServer.define("shogi", ShogiRoom);

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
