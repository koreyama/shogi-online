import React, { useEffect, useState } from 'react';
import { THEME } from './styles';

interface GameEndScreenProps {
    status: 'won' | 'lost';
    onReset: () => void;
}

export const GameEndScreen = ({ status, onReset }: GameEndScreenProps) => {
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setOpacity(1), 100);
        return () => clearTimeout(timer);
    }, []);

    const isWin = status === 'won';
    const color = isWin ? THEME.colors.primary : THEME.colors.danger;
    const title = isWin ? '人類絶滅' : 'ワクチン完成';
    const subtitle = isWin ? '世界は静寂に包まれた...' : 'ウイルスは根絶された...';

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.95)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: opacity,
            transition: 'opacity 2s ease-in',
            pointerEvents: 'auto'
        }}>
            <h1 style={{
                fontSize: '4rem',
                color: color,
                fontFamily: THEME.fonts.mono,
                textShadow: `0 0 20px ${color}`,
                marginBottom: '1rem',
                letterSpacing: '5px',
                textAlign: 'center'
            }}>
                {title}
            </h1>
            <h2 style={{
                fontSize: '2rem',
                color: '#fff',
                marginBottom: '4rem',
                fontFamily: THEME.fonts.sans,
                letterSpacing: '10px',
                textAlign: 'center',
                opacity: 0.8
            }}>
                {subtitle}
            </h2>

            <button
                onClick={onReset}
                style={{
                    padding: '1rem 3rem',
                    background: 'transparent',
                    border: `2px solid ${color}`,
                    color: color,
                    fontSize: '1.5rem',
                    fontFamily: THEME.fonts.mono,
                    cursor: 'pointer',
                    boxShadow: `0 0 15px ${color}33`,
                    transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = color;
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.boxShadow = `0 0 30px ${color}`;
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = color;
                    e.currentTarget.style.boxShadow = `0 0 15px ${color}33`;
                }}
            >
                新たな世界へ
            </button>
        </div>
    );
};
