import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

import { ensureUserExists } from '@/lib/firebase/users';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                // Ensure user is registered in DB and increment count if new
                await ensureUserExists(result.user.uid, result.user.displayName || 'Guest', result.user.photoURL || '');
            }
        } catch (error: any) {
            if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
                console.warn("Popup closed by user");
            } else {
                console.warn("Error signing in with Google", error);
            }
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.warn("Error signing out", error);
        }
    };

    return { user, loading, signInWithGoogle, signOut };
}
