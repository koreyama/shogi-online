import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, get, set } from 'firebase/database';

export const RegisteredUserCount = ({ style, className, prefix = '登録者数: ' }: { style?: React.CSSProperties, className?: string, prefix?: string }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const statsRef = ref(db, 'site_stats/user_count');

        // Initial check and set if missing
        get(statsRef).then((snapshot) => {
            if (!snapshot.exists()) {
                // Initialize to 6 as per user request if missing
                set(statsRef, 6).catch(console.error);
            }
        }).catch(console.error);

        const unsubscribe = onValue(statsRef, (snapshot) => {
            const val = snapshot.val();
            if (typeof val === 'number') {
                setCount(val);
            }
        }, (error) => {
            console.error("Failed to read user count:", error);
            // Fallback to 6 if read fails entirely to ensure display
            setCount((prev) => prev === null ? 6 : prev);
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
