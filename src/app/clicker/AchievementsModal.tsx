import React from 'react';
import { Achievement, ACHIEVEMENTS } from '@/lib/clicker/achievements';

interface AchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    unlockedAchievements: string[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, unlockedAchievements }) => {
    // Render the list of all available achievements
    if (!isOpen) return null;

    const unlockedCount = unlockedAchievements.length;
    const totalCount = ACHIEVEMENTS.length;
    const progress = Math.round((unlockedCount / totalCount) * 100);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>実績 ({unlockedCount}/{totalCount})</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#718096'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', width: '100%', height: '10px', backgroundColor: '#edf2f7', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#48bb78', transition: 'width 0.3s ease' }} />
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {ACHIEVEMENTS.map(ach => {
                        const isUnlocked = unlockedAchievements.includes(ach.id);
                        return (
                            <div key={ach.id} style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                border: `1px solid ${isUnlocked ? '#48bb78' : '#e2e8f0'}`,
                                backgroundColor: isUnlocked ? '#f0fff4' : '#f7fafc',
                                opacity: isUnlocked ? 1 : 0.7,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    fontSize: '1.5rem',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: isUnlocked ? '#48bb78' : '#cbd5e0',
                                    color: 'white',
                                    borderRadius: '50%'
                                }}>
                                    {isUnlocked ? '✓' : '?'}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 'bold', color: isUnlocked ? '#2f855a' : '#4a5568' }}>{ach.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#718096' }}>{ach.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
