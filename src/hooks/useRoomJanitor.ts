import { useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

type GameType = 'reversi' | 'gomoku' | 'mancala' | 'chess' | 'trump' | 'drawing' | 'rainbow';

interface RoomConfig {
    path: string;
    isEmpty: (room: any) => boolean;
}

const CONFIGS: Record<GameType, RoomConfig> = {
    // Shogi removed
    reversi: {
        path: 'reversi_rooms',
        isEmpty: (room) => !room.black && !room.white
    },
    gomoku: {
        path: 'gomoku_rooms',
        isEmpty: (room) => !room.black && !room.white
    },
    mancala: {
        path: 'mancala_rooms',
        isEmpty: (room) => !room.first && !room.second
    },
    chess: {
        path: 'chess_rooms',
        isEmpty: (room) => !room.white && !room.black
    },
    trump: {
        path: 'trump_rooms',
        isEmpty: (room) => !room || !room.players || Object.keys(room.players).length === 0
    },
    drawing: {
        path: 'drawing_rooms',
        isEmpty: (room) => !room.players || Object.keys(room.players).length === 0
    },
    rainbow: {
        path: 'rooms',
        isEmpty: (room) => (!room.players || Object.keys(room.players).length === 0) && room.gameType === 'rainbow'
    }
};

export const useRoomJanitor = (targetGames: GameType[] = Object.keys(CONFIGS) as GameType[]) => {
    useEffect(() => {
        const cleanup = async () => {
            for (const game of targetGames) {
                const config = CONFIGS[game];
                if (!config) continue;

                try {
                    const rootRef = ref(db, config.path);
                    const snapshot = await get(rootRef);
                    const data = snapshot.val();

                    if (!data || typeof data !== 'object') continue;

                    for (const [key, room] of Object.entries(data)) {
                        if (config.isEmpty(room)) {
                            // console.log(`Cleaning up empty room: ${config.path}/${key}`);
                            await remove(ref(db, `${config.path}/${key}`));
                        }
                    }
                } catch (error: any) {
                    // Suppress permission errors to avoid dev overlay
                    if (error?.message?.includes('Permission denied') || error?.code === 'PERMISSION_DENIED') {
                        console.warn(`Janitor permission warning for ${game} (non-fatal):`, error);
                    } else {
                        console.warn(`Janitor error for ${game}:`, error);
                    }
                }
            }
        };

        // Run on mount
        cleanup();

        // Optional: Run periodically if the user stays on the page for a long time
        const interval = setInterval(cleanup, 60000); // Every 1 minute

        return () => clearInterval(interval);
    }, [targetGames]);
};
