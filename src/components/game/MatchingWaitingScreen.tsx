import React, { useState } from 'react';
import styles from '@/styles/GameMenu.module.css';
import { IconHourglass, IconBack } from '@/components/Icons';

// SVG for Copy Icon since it might not be in the shared Icons file yet
const IconCopy = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const IconCheck = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

interface MatchingWaitingScreenProps {
    status: 'waiting' | 'connecting';
    mode: 'random' | 'room';
    roomId?: string;
    onCancel: () => void;
    gameTitle?: string; // Optional override title
}

export const MatchingWaitingScreen: React.FC<MatchingWaitingScreenProps> = ({
    status,
    mode,
    roomId,
    onCancel,
    gameTitle
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (status !== 'waiting' && status !== 'connecting') return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ minWidth: '320px', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#2d3748' }}>
                    {mode === 'random' ? '対戦相手を探しています...' : '対戦相手を待っています...'}
                </h2>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    animation: 'spin 3s linear infinite'
                }}>
                    <style jsx>{`
                        @keyframes spin { 
                            from { transform: rotate(0deg); } 
                            to { transform: rotate(360deg); } 
                        }
                    `}</style>
                    <IconHourglass size={64} color="var(--theme-primary, #3b82f6)" />
                </div>

                {mode === 'room' && roomId && (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            このIDを共有して友達と対戦
                        </p>
                        <div
                            onClick={handleCopy}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                background: 'var(--theme-bg-light)',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '2px dashed color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{
                                fontFamily: 'monospace',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: 'var(--theme-primary)',
                                letterSpacing: '0.05em'
                            }}>
                                {roomId}
                            </span>
                            <div style={{ color: copied ? '#48bb78' : '#a0aec0' }}>
                                {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                            </div>
                        </div>
                        {copied && <div style={{ color: '#48bb78', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 'bold' }}>コピーしました！</div>}
                    </div>
                )}

                {mode === 'random' && (
                    <p style={{ color: '#718096', fontSize: '0.95rem', marginBottom: '2rem' }}>
                        マッチング中... そのままお待ちください
                    </p>
                )}

                <button
                    onClick={onCancel}
                    className={styles.secondaryBtn}
                    style={{ width: '100%' }}
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
};
