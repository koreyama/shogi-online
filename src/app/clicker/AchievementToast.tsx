
import React, { useEffect, useState } from 'react';
import { IconTrophy } from '@/components/Icons';

interface ToastProps {
    message: string;
    onClose: () => void;
}

export const AchievementToast: React.FC<ToastProps> = ({ message, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Wait for fade out
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose, message]); // Add message to restart timer if new one comes in

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
            opacity: visible ? 1 : 0,
            transition: 'all 0.3s ease-out',
            backgroundColor: '#2d3748',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 2000,
            pointerEvents: 'none',
            border: '2px solid #ed8936' // Amber for flair
        }}>
            <div style={{
                backgroundColor: '#ed8936',
                borderRadius: '50%',
                padding: '0.25rem',
                display: 'flex'
            }}>
                <IconTrophy size={20} color="white" />
            </div>
            <div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e0', textTransform: 'uppercase', fontWeight: 'bold' }}>Achievement Unlocked</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{message}</div>
            </div>
        </div>
    );
};
