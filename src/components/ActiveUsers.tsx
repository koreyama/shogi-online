'use client';

import React, { useEffect, useState } from 'react';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';

export default function ActiveUsers() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let room: Room;
        const connect = async () => {
            try {
                room = await client.joinOrCreate("stats");
                console.log("Joined stats room");

                // Initial state
                setCount(room.state.count);

                room.onStateChange((state: any) => {
                    setCount(state.count);
                });
            } catch (e) {
                console.error("Failed to join stats room:", e);
            }
        };

        connect();

        return () => {
            if (room) room.leave();
        };
    }, []);

    if (count === null) return null;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.05)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            color: '#666',
            border: '1px solid rgba(0,0,0,0.1)'
        }}>
            <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: '#4ade80',
                borderRadius: '50%',
                boxShadow: '0 0 8px #4ade80'
            }}></span>
            <span style={{ fontWeight: 500 }}>現在のオンライン人数: {count}人</span>
        </div>
    );
}
