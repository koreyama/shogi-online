import { db } from "../firebase";
import { ref, get, set, update, push, child, onValue, off, runTransaction } from "firebase/database";

export interface UserStats {
    wins: number;
    losses: number;
    draws: number;
    rating: number;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    stats: Record<string, UserStats>; // gameId -> Stats
    lastSeen?: number;
}

export interface FriendRequest {
    from: string; // uid
    to: string;   // uid
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: number;
}

// Ensure user exists in DB
export const ensureUserExists = async (uid: string, displayName: string, photoURL?: string) => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
        const initialProfile: UserProfile = {
            uid,
            displayName,
            photoURL: photoURL || '',
            bio: 'よろしくお願いします！',
            stats: {},
            lastSeen: Date.now()
        };
        await set(userRef, initialProfile);

        // Increment total user count
        runTransaction(ref(db, 'site_stats/user_count'), (currentCount) => {
            return (currentCount || 0) + 1;
        });

        return initialProfile;
    } else {
        // Update basic info just in case, but DO NOT overwrite displayName if it exists
        // We only use the passed displayName if the DB one is somehow missing? 
        // For now, let's strictly preserve the DB displayName.
        // We only update lastSeen and maybe photoURL if not custom?
        // Actually, customPhotoURL overrides photoURL.
        const updates: any = { lastSeen: Date.now() };

        // Optional: Update photoURL if we want to sync Google Avatar? 
        // usually photoURL in DB is used.
        // Let's just update lastSeen to be safe and avoid overwriting profile data.
        await update(userRef, updates);
        return snapshot.val() as UserProfile;
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const snapshot = await get(ref(db, `users/${uid}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    return { ...data, uid }; // Force UID injection
};

export const updateUserBio = async (uid: string, bio: string) => {
    await update(ref(db, `users/${uid}`), { bio });
};

export const updateUserProfileData = async (uid: string, data: { displayName?: string, bio?: string, photoURL?: string }) => {
    // Filter undefined keys
    const updateData: any = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;

    await update(ref(db, `users/${uid}`), updateData);
};

// No storage needed for external URLs
export const saveAvatarUrl = async (uid: string, url: string) => {
    await update(ref(db, `users/${uid}`), { photoURL: url });
};

// --- Statistics ---
export const updateUserStats = async (uid: string, gameId: string, result: 'win' | 'loss' | 'draw') => {
    const statsRef = ref(db, `users/${uid}/stats/${gameId}`);
    const snapshot = await get(statsRef);
    let stats: UserStats = snapshot.exists() ? snapshot.val() : { wins: 0, losses: 0, draws: 0, rating: 1500 };

    if (result === 'win') stats.wins++;
    if (result === 'loss') stats.losses++;
    if (result === 'draw') stats.draws++;

    // Simple rating adjustment (placeholder)
    if (result === 'win') stats.rating += 10;
    if (result === 'loss') stats.rating -= 10;

    await set(statsRef, stats);
};

// --- Friends ---
export const sendFriendRequest = async (fromUid: string, toUid: string) => {
    if (fromUid === toUid) throw new Error("自分自身にフレンド申請はできません");

    // Check if already friends or pending
    const existingCheck = await get(ref(db, `friends/${fromUid}/${toUid}`));
    if (existingCheck.exists()) return; // Already related

    const request: FriendRequest = {
        from: fromUid,
        to: toUid,
        status: 'pending',
        timestamp: Date.now()
    };

    // Store bi-directionally or just in requests?
    // Let's store in `friend_requests` mainly, or `friends` with status.
    // Structure: friends/{myUid}/{theirUid} = { status: ... }

    await update(ref(db, `friends/${fromUid}/${toUid}`), { status: 'pending', direction: 'sent' });
    await update(ref(db, `friends/${toUid}/${fromUid}`), { status: 'pending', direction: 'received' });
};

export const acceptFriendRequest = async (myUid: string, theirUid: string) => {
    await update(ref(db, `friends/${myUid}/${theirUid}`), { status: 'accepted' });
    await update(ref(db, `friends/${theirUid}/${myUid}`), { status: 'accepted' });
};

export const rejectFriendRequest = async (myUid: string, theirUid: string) => {
    // Remove the friend entry entirely or set status to rejected?
    // Removing is cleaner for re-requesting.
    await set(ref(db, `friends/${myUid}/${theirUid}`), null);
    await set(ref(db, `friends/${theirUid}/${myUid}`), null);
};

export const removeFriend = async (myUid: string, theirUid: string) => {
    await rejectFriendRequest(myUid, theirUid); // Same logic: remove relationship
};

export const getFriends = async (uid: string) => {
    const snapshot = await get(ref(db, `friends/${uid}`));
    if (!snapshot.exists()) return [];

    const friendsObj = snapshot.val();
    const friendKeys = Object.keys(friendsObj);

    // Fetch details for each friend
    const promises = friendKeys.map(async (key) => {
        const profile = await getUserProfile(key);
        return {
            uid: key,
            ...friendsObj[key],
            displayName: profile?.displayName || 'Unknown',
            photoURL: profile?.photoURL || ''
        };
    });

    return Promise.all(promises);
};
