import { db } from '@/lib/firebase';
import { ref, push, query, orderByChild, limitToFirst, get, set, equalTo, update, endAt } from 'firebase/database';
import { Difficulty } from './types';

export interface ScoreEntry {
    id: string;
    userId: string;
    userName: string;
    time: number;
    timestamp: number;
}

export const submitScore = async (userId: string, userName: string, difficulty: Difficulty, time: number) => {
    const scoresRef = ref(db, `minesweeper_scores/${difficulty.name}`);

    // Check for existing score by this user
    const userScoreQuery = query(scoresRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userScoreQuery);

    if (snapshot.exists()) {
        // User already has a score entry
        let existingKey = '';
        let existingTime = Infinity;

        snapshot.forEach((child) => {
            existingKey = child.key!;
            existingTime = child.val().time;
        });

        // Only update if the new time is better (lower)
        if (time < existingTime) {
            const existingScoreRef = ref(db, `minesweeper_scores/${difficulty.name}/${existingKey}`);
            await update(existingScoreRef, {
                time,
                userName, // Update name in case it changed
                timestamp: Date.now()
            });
        }
    } else {
        // No existing score, create new entry
        const newScoreRef = push(scoresRef);
        await set(newScoreRef, {
            userId,
            userName,
            time,
            timestamp: Date.now()
        });
    }
};

export const getRankings = async (difficulty: Difficulty): Promise<ScoreEntry[]> => {
    try {
        const scoresRef = ref(db, `minesweeper_scores/${difficulty.name}`);
        const q = query(scoresRef, orderByChild('time'), limitToFirst(10));

        const snapshot = await get(q);
        const rankings: ScoreEntry[] = [];

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const data = child.val();
                rankings.push({
                    id: child.key!,
                    userId: data.userId,
                    userName: data.userName,
                    time: data.time,
                    timestamp: data.timestamp
                });
            });
        }

        return rankings;
    } catch (error) {
        console.error("Failed to fetch rankings:", error);
        return [];
    }
};
export const getUserRank = async (difficulty: Difficulty, time: number): Promise<number> => {
    try {
        const scoresRef = ref(db, `minesweeper_scores/${difficulty.name}`);
        // Minesweeper rank is based on TIME (lower is better).
        // RTDB sorts ascending. So smallest time comes first.
        // We want to count how many scores are strictly smaller than my time.
        // endAt(time - 0.001) would get everyone better than me.
        const betterScoresQuery = query(scoresRef, orderByChild('time'), endAt(time - 0.01));

        const snapshot = await get(betterScoresQuery);
        return snapshot.exists() ? snapshot.size + 1 : 1;
    } catch (error) {
        console.error("Failed to get user rank:", error);
        return 0;
    }
};
