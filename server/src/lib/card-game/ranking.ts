import { db, auth } from '@/lib/firebase';
import { ref, get, set, query, orderByChild, limitToLast } from 'firebase/database';

export const DEFAULT_RATING = 1000;
export const K_FACTOR = 32;

export interface RankingUser {
    userId: string;
    name: string;
    rating: number;
    wins: number;
    losses: number;
    matches: number;
}

/**
 * Calculates the expected score for a player against an opponent.
 * @param ratingPlayer Rating of the player
 * @param ratingOpponent Rating of the opponent
 * @returns Expected score (0 to 1)
 */
export function getExpectedScore(ratingPlayer: number, ratingOpponent: number): number {
    return 1 / (1 + Math.pow(10, (ratingOpponent - ratingPlayer) / 400));
}

/**
 * Calculates the new rating based on the result.
 * @param currentRating Current rating
 * @param opponentRating Opponent's rating
 * @param result 1 for win, 0 for loss, 0.5 for draw
 * @returns New rating (integer)
 */
export function calculateNewRating(currentRating: number, opponentRating: number, result: number): number {
    const expectedScore = getExpectedScore(currentRating, opponentRating);
    const newRating = currentRating + K_FACTOR * (result - expectedScore);
    return Math.round(newRating);
}

/**
 * Fetches a user's ranking data from Firebase (or LocalStorage fallback).
 * @param userId User ID
 * @returns RankingUser object or default initial data
 */
export async function getUserRanking(userId: string): Promise<RankingUser> {
    // 1. Try LocalStorage (for guests or explicit local storage override/cache)
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`ranking_${userId}`);
        if (local) {
            try {
                return JSON.parse(local) as RankingUser;
            } catch (e) {
                console.error("Error parsing local ranking", e);
            }
        }
    }

    // 2. Try Firebase (Leaderboard node)
    try {
        const snapshot = await get(ref(db, `leaderboard/${userId}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            return {
                userId: data.userId || userId,
                name: data.name || 'Player',
                rating: typeof data.rating === 'number' ? data.rating : DEFAULT_RATING,
                wins: typeof data.wins === 'number' ? data.wins : 0,
                losses: typeof data.losses === 'number' ? data.losses : 0,
                matches: typeof data.matches === 'number' ? data.matches : 0
            };
        }
    } catch (e) {
        console.warn("Error fetching user ranking from Firebase (using default):", e);
    }

    // Default if not found
    return {
        userId,
        name: 'Player', // Should be updated with real name if possible
        rating: DEFAULT_RATING,
        wins: 0,
        losses: 0,
        matches: 0
    };
}

/**
 * Updates a user's ranking data in Firebase after a match.
 * @param userId User ID
 * @param userName User Name (to ensure it's up to date)
 * @param opponentRating Rating of the opponent
 * @param isWin true if win, false if loss
 */
export async function updateUserRankingAfterMatch(userId: string, userName: string, opponentRating: number, isWin: boolean) {
    const currentData = await getUserRanking(userId);

    // Update Name
    currentData.name = userName;

    // Calculate New Rating
    const resultScore = isWin ? 1 : 0;
    const newRating = calculateNewRating(currentData.rating, opponentRating, resultScore);

    // Update Stats
    currentData.rating = newRating;
    currentData.matches += 1;
    if (isWin) currentData.wins += 1;
    else currentData.losses += 1;

    // 1. Save to LocalStorage (Always work as backup & for Guests)
    if (typeof window !== 'undefined') {
        localStorage.setItem(`ranking_${userId}`, JSON.stringify(currentData));
    }

    // 2. Check Authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
        console.log("Guest or mismatched User ID. Ranking saved locally only.");
        return; // Stop here to prevent Permission Denied errors
    }

    // 3. Save to Firebase (Only if authenticated)
    try {
        // Save to leaderboard (Public source of truth)
        await set(ref(db, `leaderboard/${userId}`), {
            userId,
            name: userName,
            rating: newRating,
            wins: currentData.wins,
            matches: currentData.matches,
            losses: currentData.losses
        });

        // Save to users (Personal backup - best effort)
        try {
            await set(ref(db, `users/${userId}/ranking`), currentData);
        } catch { } // Ignore errors on backup

        console.log(`Updated ranking for ${userName}: New Rating ${newRating}`);
    } catch (e: any) {
        if (e.code === 'PERMISSION_DENIED') {
            console.error("Firebase Permission Denied. Please ensure 'database.rules.json' is deployed to Firebase Console.");
            console.error("Run: firebase deploy --only database");
        } else {
            console.error("Error saving user ranking to Firebase:", e);
        }
    }
}

/**
 * Fetches the top leaderboard.
 * @param limit Number of users to fetch
 * @returns Array of RankingUser sorted by rating descending
 */
export async function getLeaderboard(limit: number = 20): Promise<RankingUser[]> {
    try {
        // Query the 'leaderboard' node
        const lbRef = ref(db, 'leaderboard');
        const q = query(lbRef, orderByChild('rating'), limitToLast(limit));
        const snapshot = await get(q);

        const leaderboard: RankingUser[] = [];
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            leaderboard.push({
                ...data,
                losses: data.losses !== undefined ? data.losses : (data.matches - data.wins)
            } as RankingUser);
        });

        // Firebase returns ascending order for value queries, so reverse it
        return leaderboard.reverse();
    } catch (e: any) {
        console.error("Error fetching leaderboard:", e?.message || e);
        return [];
    }
}
