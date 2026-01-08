'use client';

import React, { useEffect, useState } from 'react';

export const RegisteredUserCount = ({ style, className, prefix = '登録者数: ' }: { style?: React.CSSProperties, className?: string, prefix?: string }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                // Use REST API with shallow=true to get keys without downloading all data
                const res = await fetch('https://webshogi-b1015-default-rtdb.firebaseio.com/users.json?shallow=true');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                if (data) {
                    setCount(Object.keys(data).length);
                }
            } catch (e) {
                console.error("Failed to fetch user count:", e);
                // Fallback or silently fail
            }
        };

        fetchCount();
    }, []);

    if (count === null) return null;

    return (
        <div style={style} className={className}>
            {prefix}{count.toLocaleString()}名
        </div>
    );
};
