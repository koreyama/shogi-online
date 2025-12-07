import React, { useState } from 'react';
import { THEME } from './styles';

interface TitleScreenProps {
    onStart: () => void;
}

export const TitleScreen = ({ onStart }: TitleScreenProps) => {
    const [hover, setHover] = useState(false);

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)', // Slight dim to show 3D globe in background
            backdropFilter: 'blur(2px)'
        }}>
            <h1 style={{
                fontSize: '5rem',
                color: THEME.colors.danger,
                fontFamily: THEME.fonts.mono,
                margin: 0,
                textShadow: '0 0 20px rgba(255, 42, 109, 0.8)',
                letterSpacing: '10px',
                animation: 'glitch 2s infinite'
            }}>
                PANDEMIC_JP
            </h1>
            <div style={{
                fontSize: '1.5rem',
                color: THEME.colors.primary,
                fontFamily: THEME.fonts.mono,
                marginBottom: '4rem',
                letterSpacing: '5px',
                opacity: 0.8
            }}>
                GLOBAL INFECTION SIMULATOR
            </div>

            <button
                onClick={onStart}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    padding: '1rem 4rem',
                    fontSize: '2rem',
                    background: hover ? THEME.colors.primary : 'transparent',
                    color: hover ? '#000' : THEME.colors.primary,
                    border: `2px solid ${THEME.colors.primary}`,
                    cursor: 'pointer',
                    fontFamily: THEME.fonts.mono,
                    transition: 'all 0.3s',
                    boxShadow: hover ? `0 0 30px ${THEME.colors.primary}` : `0 0 10px ${THEME.colors.primary}`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                INITIALIZE
            </button>
            <style jsx>{`
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
            `}</style>
        </div>
    );
};
