'use client';

import React, { useEffect, useState } from 'react';
import GlobalChat from './dashboard/GlobalChat';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function GlobalChatWrapper() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    if (!user) return null;

    return (
        <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
                <GlobalChat user={user} />
            </div>
        </div>
    );
}
