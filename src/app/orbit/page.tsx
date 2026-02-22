'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FloatingShapes } from '@/components/landing/FloatingShapes';

const OrbitGame = dynamic(() => import('@/components/orbit/OrbitGame'), { ssr: false });
const Leaderboard = dynamic(() => import('@/components/orbit/Leaderboard'), { ssr: false });
import navStyles from '@/styles/GameMenu.module.css';

const IconArrowLeft = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l14 0" />
        <path d="M5 12l6 6" />
        <path d="M5 12l6 -6" />
    </svg>
);

export default function OrbitPage() {
    // Only client side? No, NextJS component is fine. Main logic is in component.
    // However, custom events need window.
    // Add state for leaderboard visibility
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    useEffect(() => {
        // Prevent default touch actions on buttons if needed, generally handled by touch-action: none on game
    }, []);
    return (
        <main className={navStyles.main} style={{
            '--theme-primary': '#805ad5',
            '--theme-secondary': '#6b46c1',
            '--theme-bg-light': '#f3e8ff',
            minHeight: 'auto',
            flex: '1',
            paddingBottom: '6rem',
            position: 'relative',
            zIndex: 0
        } as React.CSSProperties}>
            <FloatingShapes />

            {/* Header removed (merged below) */}

            <div className={navStyles.gameContainer} style={{ gap: '1rem' }}>
                <h1 className={navStyles.title} style={{ color: '#805ad5', fontSize: '2.5rem', marginBottom: '0.2rem' }}>Orbit Star</h1>
                <p className={navStyles.subtitle} style={{ margin: '0 0 1.5rem 0' }}>360° 惑星パズル</p>

                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '800px'
                }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        <Link href="/" className={navStyles.backButton}>
                            <IconArrowLeft size={18} />
                            <span>ダッシュボードに戻る</span>
                        </Link>

                        <button
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            style={{
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid #ffd700',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                color: '#ffd700',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>🏆</span>
                            <span>Ranking</span>
                        </button>

                        {/* Leaderboard Overlay */}
                        {showLeaderboard && (
                            <div style={{
                                position: 'absolute',
                                top: '50px',
                                right: '0',
                                zIndex: 100
                            }}>
                                <Leaderboard />
                            </div>
                        )}
                    </div>

                    {/* Game Surface */}
                    <div style={{
                        height: 'min(70vh, 700px)',
                        width: 'auto',
                        aspectRatio: '1/1', // Square for circular orbit
                        maxWidth: 'min(80vw, 700px)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        border: '4px solid #e9d8fd',
                        // Deeper space background
                        background: '#0f0c29',
                        margin: '0 auto',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <OrbitGame />

                        {/* Galaxy Spin Controls */}
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '0',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0 20px',
                            pointerEvents: 'none' // Let clicks pass through empty space
                        }}>
                            {/* ... buttons ... */}
                            <button
                                style={{
                                    width: '60px', height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    color: 'white',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    backdropFilter: 'blur(4px)'
                                }}
                                onMouseDown={() => window.dispatchEvent(new CustomEvent('orbit-spin-start', { detail: { direction: -1 } }))}
                                onMouseUp={() => window.dispatchEvent(new CustomEvent('orbit-spin-end'))}
                                onMouseLeave={() => window.dispatchEvent(new CustomEvent('orbit-spin-end'))}
                                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('orbit-spin-start', { detail: { direction: -1 } })); }}
                                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('orbit-spin-end')); }}
                            >
                                ↺
                            </button>

                            <button
                                style={{
                                    width: '60px', height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    color: 'white',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    backdropFilter: 'blur(4px)'
                                }}
                                onMouseDown={() => window.dispatchEvent(new CustomEvent('orbit-spin-start', { detail: { direction: 1 } }))}
                                onMouseUp={() => window.dispatchEvent(new CustomEvent('orbit-spin-end'))}
                                onMouseLeave={() => window.dispatchEvent(new CustomEvent('orbit-spin-end'))}
                                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('orbit-spin-start', { detail: { direction: 1 } })); }}
                                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('orbit-spin-end')); }}
                            >
                                ↻
                            </button>
                        </div>

                        {/* Leaderboard Toggle Button */}
                        {/* <button
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                zIndex: 20,
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid #ffd700',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                color: '#ffd700',
                                fontSize: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            🏆
                        </button> */}

                        {/* Leaderboard Overlay */}
                        {/* {showLeaderboard && (
                            <div style={{
                                position: 'absolute',
                                top: '70px',
                                right: '20px',
                                pointerEvents: 'none',
                                zIndex: 10
                            }}>
                                <div style={{ pointerEvents: 'auto' }}>
                                    <Leaderboard />
                                </div>
                            </div>
                        )} */}
                    </div>
                </div>
            </div>

            {/* Rules Section */}
            <div className={navStyles.contentSection} style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🌌</span>
                        <h3 className={navStyles.sectionTitle}>遊び方 (Mission)</h3>
                    </div>
                    <ul className={navStyles.textBlock} style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>クリック/タップ:</strong> その角度から惑星を投入</li>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>重力:</strong> 全ては中心に向かって落ちる</li>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>合体:</strong> 同じ惑星をぶつけて進化させる</li>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>大気圏:</strong> 赤いラインを超えたらゲームオーバー</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
