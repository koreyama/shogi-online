import { useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

type GameType = 'shogi' | 'reversi' | 'gomoku' | 'mancala' | 'chess' | 'trump' | 'drawing';

interface RoomConfig {
    path: string;
    isEmpty: (room: any) => boolean;
}

const CONFIGS: Record<GameType, RoomConfig> = {
    shogi: {
        path: 'rooms',
        isEmpty: (room) => !room.sente && !room.gote
    },
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
        isEmpty: (room) => !room.players || Object.keys(room.players).length === 0
    },
    drawing: {
        path: 'drawing_rooms',
        isEmpty: (room) => !room.players || Object.keys(room.players).length === 0
    }
};

export const useRoomJanitor = (targetGames: GameType[] = Object.keys(CONFIGS) as GameType[]) => {
    useEffect(() => {
        const cleanup = async () => {
            for (const game of targetGames) {
                const config = CONFIGS[game];
                try {
                    const rootRef = ref(db, config.path);
                    const snapshot = await get(rootRef);
                    const data = snapshot.val();

                    if (!data) continue;

                    for (const [key, room] of Object.entries(data)) {
                        if (config.isEmpty(room)) {
                            // console.log(`Cleaning up empty room: ${config.path}/${key}`);
                            await remove(ref(db, `${config.path}/${key}`));
                        }
                    }
                } catch (error) {
                    console.error(`Janitor error for ${game}:`, error);
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
