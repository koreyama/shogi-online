import { db } from "../firebase";
import { ref, runTransaction, query, orderByChild, limitToLast, get } from "firebase/database";

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
