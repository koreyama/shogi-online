'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css'; // Reuse existing styles or update
import { useAuth } from '@/hooks/useAuth';
import { IconUser, IconBack, IconPalette, IconSearch, IconPlus, IconDoorEnter } from '@/components/Icons'; // Ensure icons exist
import dynamic from 'next/dynamic';
import HideChatBot from '@/components/HideChatBot';

const ColyseusDrawingGame = dynamic(() => import('./ColyseusDrawingGame'), {
    ssr: false,
    loading: () => <div className={styles.loading}>読み込み中...</div>
});

export default function DrawingPage() {
    const router = useRouter();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();

    // Modes:
    // 'menu': Main Menu
    // 'input_room': Entering Room ID
    // 'game_random': Playing Random Match
    // 'game_room': Playing Private Room
    const [view, setView] = useState<'menu' | 'input_room' | 'game_random' | 'game_room'>('menu');
    const [targetRoomId, setTargetRoomId] = useState('');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    const handleExit = () => {
        setView('menu');
        setTargetRoomId('');
    };

    if (authLoading || !user) return <div className={styles.loading}>読み込み中...</div>;

    if (view === 'game_random') {
        return <><HideChatBot /><ColyseusDrawingGame
            playerId={user.uid}
            playerName={user.displayName || 'Guest'}
            mode="random"
            onBack={handleExit}
        /></>;
    }

    if (view === 'game_room') {
        return <><HideChatBot /><ColyseusDrawingGame
            playerId={user.uid}
            playerName={user.displayName || 'Guest'}
            mode="room"
            roomId={targetRoomId}
            onBack={handleExit}
        /></>;
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <IconBack size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IconPalette size={32} color="#d53f8c" />
                        <h1>お絵かきクイズ</h1>
                    </div>
                </div>
                <div className={styles.userInfo}>
                    <IconUser size={20} />
                    <span>{user.displayName}</span>
                </div>
            </div>

            <div className={styles.content}>

                {/* Menu Section */}
                {view === 'menu' && (
                    <div className={styles.menuContainer} style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>

                        <div className={styles.menuCard} onClick={() => setView('game_random')}
                            style={{
                                background: 'white', padding: '2rem', borderRadius: '1rem',
                                border: '2px solid #e2e8f0', marginBottom: '1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.2s',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e: any) => e.currentTarget.style.borderColor = '#d53f8c'}
                            onMouseOut={(e: any) => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <div style={{ background: '#fdf2f8', padding: '1rem', borderRadius: '50%', color: '#db2777' }}>
                                <IconSearch size={32} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>ランダムマッチ (Random Match)</h2>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                                    空いている部屋を自動で探して参加します
                                </p>
                            </div>
                        </div>

                        <div className={styles.menuCard} onClick={() => setView('input_room')}
                            style={{
                                background: 'white', padding: '2rem', borderRadius: '1rem',
                                border: '2px solid #e2e8f0', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.2s',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e: any) => e.currentTarget.style.borderColor = '#3182ce'}
                            onMouseOut={(e: any) => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <div style={{ background: '#ebf8ff', padding: '1rem', borderRadius: '50%', color: '#3182ce' }}>
                                <IconDoorEnter size={32} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>ルーム作成・参加 (Private Room)</h2>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                                    IDを指定して友達と遊びます
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Room ID Section */}
                {view === 'input_room' && (
                    <div className={styles.menuContainer} style={{ maxWidth: '500px', margin: '0 auto', width: '100%', background: 'white', padding: '2rem', borderRadius: '16px' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>ルーム参加・作成</h2>
                        <input
                            value={targetRoomId}
                            onChange={(e) => setTargetRoomId(e.target.value)}
                            placeholder="ルームIDを入力 (空欄で新規作成)"
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '1rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                        />
                        <button
                            onClick={() => setView('game_room')}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '8px', border: 'none',
                                background: targetRoomId ? '#3182ce' : '#10b981',
                                color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                                marginBottom: '1rem'
                            }}
                        >
                            {targetRoomId ? '参加する' : '新規ルーム作成'}
                        </button>
                        <button
                            onClick={() => setView('menu')}
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none',
                                background: '#f1f5f9', color: '#64748b', fontSize: '1rem', cursor: 'pointer'
                            }}
                        >
                            キャンセル
                        </button>
                    </div>
                )}

                {/* Rules Section (Keep original content) */}
                {view === 'menu' && (
                    <div className={styles.contentSection} style={{ marginTop: '3rem' }}>
                        <h2 className={styles.contentTitle}>お絵かきクイズの遊び方</h2>
                        { /* Content preserved from original file effectively by user request to maintain rules info */}
                        <div className={styles.sectionBlock}>
                            <p className={styles.textBlock}>
                                お題に沿って絵を描き、他のプレイヤーがそれを当てるゲームです。
                                素早く正解すると高得点！
                            </p>
                            <ul className={styles.list}>
                                <li className={styles.listItem}><strong>Drawer:</strong> お題を選んで絵を描きます。文字は禁止！</li>
                                <li className={styles.listItem}><strong>Guesser:</strong> チャットで答えを入力します。</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
