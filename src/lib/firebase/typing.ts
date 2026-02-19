import { db } from "../firebase";
import { ref, runTransaction, query, orderByChild, limitToLast, get, startAt } from "firebase/database";

export interface TypingScore {
    userId: string;
    displayName: string;
    photoURL?: string;
    score: number;
    wpm: number;
    accuracy: number;
    timestamp: number;
}

/**
 * Save typing score if it's a personal best for the difficulty
 */
export const saveTypingScore = async (
    difficulty: string,
    user: { uid: string, displayName: string, photoURL?: string },
    scoreData: { score: number, wpm: number, accuracy: number }
) => {
    const scoreRef = ref(db, `typing_scores/${difficulty}/${user.uid}`);

    try {
        await runTransaction(scoreRef, (currentData) => {
            if (currentData === null) {
                return {
                    userId: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL || '',
                    ...scoreData,
                    timestamp: Date.now()
                };
            } else {
                // Only update if new score is higher
                if (scoreData.score > currentData.score) {
                    return {
                        userId: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL || '',
                        ...scoreData,
                        timestamp: Date.now()
                    };
                }
            }
            return currentData; // No change
        });
    } catch (error) {
        console.error("Error saving typing score:", error);
    }
};

/**
 * Get top ranking scores for a difficulty
 */
export const getTypingRanking = async (difficulty: string, limit: number = 20): Promise<TypingScore[]> => {
    if (!difficulty) {
        console.error("getTypingRanking called with empty difficulty");
        return [];
    }
    if (!db) {
        console.error("Firebase DB not initialized");
        return [];
    }
    console.log(`Fetching ranking for difficulty: ${difficulty}, limit: ${limit}`);

    const scoresRef = ref(db, `typing_scores/${difficulty}`);
    // Order by score. RTDB sorts ascending.
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(limit));

    try {
        const snapshot = await get(topScoresQuery);
        if (!snapshot.exists()) return [];

        const scores: TypingScore[] = [];
        snapshot.forEach((childSnapshot) => {
            scores.push(childSnapshot.val());
        });

        // Reverse to get descending order (High score first)
        return scores.reverse();
    } catch (error) {
        console.error("Error fetching typing ranking:", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message, error.stack);
        }
        return [];
    }
};

/**
 * Get user's best score for a difficulty
 */
export const getUserBestScore = async (difficulty: string, userId: string): Promise<TypingScore | null> => {
    try {
        const snapshot = await get(ref(db, `typing_scores/${difficulty}/${userId}`));
        if (!snapshot.exists()) return null;
        return snapshot.val();
    } catch (error) {
        console.error("Error fetching user best score:", error);
        return null;
    }
};
/**
 * Get user's ranking (1-based index) based on score
 * Returns rank if found, or null/estimate if too low
 */
export const getUserRank = async (difficulty: string, score: number): Promise<number> => {
    try {
        const scoresRef = ref(db, `typing_scores/${difficulty}`);
        // Get all scores greater than the user's score to count them
        // RTDB sorts ascending. startAt(score + 1) gets everything strictly greater
        // Note: For equal scores, we ideally rank them the same. 
        // So we count how many are STRICTLY greater, then add 1.
        const higherScoresQuery = query(scoresRef, orderByChild('score'), startAt(score + 1));

        const snapshot = await get(higherScoresQuery);

        // snapshot.size is available in newer SDKs, or we count manually
        // RTDB snapshot usually has .size or numChildren()
        return snapshot.exists() ? snapshot.size + 1 : 1;
    } catch (error) {
        console.error("Error fetching user rank:", error);
        return 0; // 0 means unknown/error
    }
};
