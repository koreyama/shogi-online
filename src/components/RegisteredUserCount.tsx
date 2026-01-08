import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

export const RegisteredUserCount = ({ style, className, prefix = '登録者数: ' }: { style?: React.CSSProperties, className?: string, prefix?: string }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const statsRef = ref(db, 'site_stats/user_count');

        const unsubscribe = onValue(statsRef, (snapshot) => {
            const val = snapshot.val();
            if (typeof val === 'number') {
                setCount(val);
            }
        }, (error) => {
            // Silently fail or log debug only
            // console.debug("Failed to read user count:", error);
            setCount(null);
        });

        return () => {
            unsubscribe(); // onValue returns unsubscribe function
        };
    }, []);

    if (count === null) return null;

    return (
        <div style={style} className={className}>
            {prefix}{count.toLocaleString()}名
        </div>
    );
};
