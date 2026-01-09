import * as Colyseus from "colyseus.js";

// Determine the WebSocket URL based on environment
// For local development, use localhost:2567
// For production, use the Render URL (to be configured later)
const host = "shogi-server.onrender.com";
const protocol = "wss";
// const host = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
//     ? "localhost:2567"
//     : "shogi-server.onrender.com";

export const client = new Colyseus.Client(`${protocol}://${host}`);

export const joinColyseusRoom = async (roomName: string, options?: any) => {
    try {
        const room = await client.joinOrCreate(roomName, options);
        console.log("Joined Colyseus room:", room.name, room.sessionId);
        return room;
    } catch (e) {
        console.error("Failed to join Colyseus room:", e);
        throw e;
    }
};
