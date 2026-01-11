import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, get, set } from 'firebase/database';

export const RegisteredUserCount = ({ style, className, prefix = '登録者数: ' }: { style?: React.CSSProperties, className?: string, prefix?: string }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const statsRef = ref(db, 'site_stats/user_count');

        // Initial check and set if missing or less than 8 (manual correction)
        get(statsRef).then((snapshot) => {
            const val = snapshot.val();
            if (!snapshot.exists() || (typeof val === 'number' && val < 8)) {
                set(statsRef, 8).catch(console.error);
            }
        }).catch(console.error);

        const unsubscribe = onValue(statsRef, (snapshot) => {
            const val = snapshot.val();
            if (typeof val === 'number') {
                setCount(val);
            }
        }, (error) => {
            // Permission denied is expected if rules aren't updated yet.
            // Be silent to avoid alarming the user, and fallback to 8.
            // console.warn("User count read failed (likely permission):", error.message);
            setCount((prev) => prev === null ? 8 : prev);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Placeholder while loading or if 0
    const displayCount = count !== null ? count : '...';

    return (
        <div style={style} className={className}>
            {prefix}{displayCount.toLocaleString()}{typeof displayCount === 'number' ? '名' : ''}
        </div>
    );
};
