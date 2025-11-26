'use client';

import React, { useState, useEffect } from 'react';
import { IconHourglass } from '@/components/Icons';

interface TimerProps {
    endTime: number;
    onTimeUp?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ endTime, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                if (onTimeUp) onTimeUp();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, onTimeUp]);

    const isWarning = timeLeft <= 10;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: isWarning ? '#e53e3e' : '#2d3748',
            fontWeight: 'bold',
            fontSize: '1.2rem'
        }}>
            <IconHourglass size={24} />
            <span>{timeLeft}s</span>
        </div>
    );
};
