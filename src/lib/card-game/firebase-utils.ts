import { ref, set, get, onValue, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { GameState, PlayerState } from "./types";
import { drawCards } from "./engine";

export const createRoom = async (hostPlayer: PlayerState): Promise<string> => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = ref(db, `rooms/${roomId}`);

    // Initial partial state with just the host
    const initialState: Partial<GameState> = {
        roomId,
        turnPlayerId: hostPlayer.id, // Host goes first by default
        phase: 'draw',
        players: {
            [hostPlayer.id]: hostPlayer
        },
        turnCount: 1,
        log: [],
        turnState: { hasAttacked: false }
    };

    await set(roomRef, initialState);
    return roomId;
};

export const joinRoom = async (roomId: string, player: PlayerState): Promise<boolean> => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        return false;
    }

    const currentData = snapshot.val();
    if (currentData.players && Object.keys(currentData.players).length >= 2) {
        return false; // Room full
    }

    // Add player
    const updatedPlayers = {
        ...currentData.players,
        [player.id]: player
    };

    // If room is now full (2 players), initialize game
    if (Object.keys(updatedPlayers).length === 2) {
        // Create a temporary state to run drawCards
        const tempState: GameState = {
            ...currentData,
            players: updatedPlayers,
            log: currentData.log || []
        };

        // Draw 5 cards for each player
        Object.keys(updatedPlayers).forEach(pid => {
            drawCards(tempState, pid, 5);
        });

        // Update room with full state
        await update(ref(db, `rooms/${roomId}`), tempState);
    } else {
        // Just add player
        await update(ref(db, `rooms/${roomId}/players`), {
            [player.id]: player
        });
    }

    return true;
};

export const subscribeToRoom = (roomId: string, callback: (state: GameState) => void) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data as GameState);
        }
    });
};

export const syncGameState = async (roomId: string, state: GameState) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    await update(roomRef, state);
};

export const findRandomRoom = async (player: PlayerState): Promise<string> => {
    const roomsRef = ref(db, 'rooms');
    const snapshot = await get(roomsRef);
    const rooms = snapshot.val();

    let foundRoomId = null;

    if (rooms) {
        // Find a room with only 1 player (host) and no second player
        for (const [id, room] of Object.entries(rooms) as [string, any][]) {
            if (room.players && Object.keys(room.players).length === 1) {
                foundRoomId = id;
                break;
            }
        }
    }

    if (foundRoomId) {
        // Join existing room
        await joinRoom(foundRoomId, player);
        return foundRoomId;
    } else {
        // Create new room
        return await createRoom(player);
    }
};
