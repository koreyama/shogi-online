import { db, auth } from '@/lib/firebase';
import { ref, get, set, query, orderByChild, limitToLast } from 'firebase/database';

export interface YachtScore {
    userId: string;
    userName: string;
    score: number;
    timestamp: number;
}

/**
 * Saves a user's Yacht high score to Firebase.
 * Only updates if the new score is higher than the existing one.
 */
export async function saveYachtScore(userId: string, userName: string, score: number) {
    if (!userId || !auth.currentUser) return;

    try {
        const userScoreRef = ref(db, `yacht_leaderboard/${userId}`);
        const snapshot = await get(userScoreRef);

        if (snapshot.exists()) {
            const currentData = snapshot.val();
            if (currentData.score >= score) {
                console.log("New score is not higher than existing high score. Skipping update.");
                return;
            }
        }

        await set(userScoreRef, {
            userId,
            userName,
            score,
            timestamp: Date.now()
        });
        console.log(`Saved new high score for ${userName}: ${score}`);
    } catch (e: any) {
        if (e.code === 'PERMISSION_DENIED') {
            console.error("Firebase Permission Denied. Ensure rules allow writing to 'yacht_leaderboard'.");
        } else {
            console.error("Error saving Yacht score:", e);
        }
    }
}

/**
 * Fetches the top yacht scores.
 */
export async function getYachtLeaderboard(limit: number = 20): Promise<YachtScore[]> {
    try {
        const lbRef = ref(db, 'yacht_leaderboard');
        const q = query(lbRef, orderByChild('score'), limitToLast(limit));
        const snapshot = await get(q);

        const leaderboard: YachtScore[] = [];
        snapshot.forEach((childSnapshot) => {
            leaderboard.push(childSnapshot.val());
        });

        // Firebase returns ascending order, so reverse to get highest first
        return leaderboard.reverse();
    } catch (e: any) {
        console.error("Error fetching yacht leaderboard:", e);
        return [];
    }
}
