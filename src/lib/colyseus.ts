import * as Colyseus from "colyseus.js";

// Determine the WebSocket URL based on environment
// For local development, use localhost:2567
// For production, use the Render URL (to be configured later)
// Determine the WebSocket URL based on environment
const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
const host = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
    ? "localhost:2567"
    : (process.env.NEXT_PUBLIC_GAME_SERVER_URL || process.env.NEXT_PUBLIC_COLYSEUS_URL || "shogi-server.onrender.com").replace(/^wss?:\/\//, '');

export const client = new Colyseus.Client(`${protocol}://${host}`);

export const joinColyseusRoom = async (roomName: string, options?: any) => {
    try {
        const room = await client.joinOrCreate(roomName, options);
        console.log("Joined Colyseus room:", room.name, room.sessionId);
        return room;
    } catch (e) {
        console.warn("Failed to join Colyseus room:", e);
        throw e;
    }
};
