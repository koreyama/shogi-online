'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../drawing/page.module.css';
import { useAuth } from '@/hooks/useAuth';
import { IconUser, IconBack, IconDoorEnter, IconPlus } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import dynamic from 'next/dynamic';
import HideChatBot from '@/components/HideChatBot';

const ColyseusEshiritoriGame = dynamic(() => import('./ColyseusEshiritoriGame'), {
    ssr: false,
    loading: () => <div className={styles.loading}>読み込み中...</div>
});

const ESHIRITORI_THEME = {
    '--theme-primary': '#f59e0b',
    '--theme-secondary': '#d97706',
    '--theme-tertiary': '#fbbf24',
    '--theme-bg-light': '#fffbeb',
    '--theme-text-title': 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
} as React.CSSProperties;

export default function EshiritoriPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName } = usePlayer();

    const [view, setView] = useState<'menu' | 'input_room' | 'game_create' | 'game_join'>('menu');
    const [targetRoomId, setTargetRoomId] = useState('');

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

    if (view === 'game_create') {
        return <>
            <HideChatBot />
            <ColyseusEshiritoriGame
                playerId={user.uid}
                playerName={playerName || user.displayName || 'Guest'}
                mode="create"
                onBack={handleExit}
            />
        </>;
    }

    if (view === 'game_join') {
        return <>
            <HideChatBot />
            <ColyseusEshiritoriGame
                playerId={user.uid}
                playerName={playerName || user.displayName || 'Guest'}
                mode="join"
                roomId={targetRoomId}
                onBack={handleExit}
            />
        </>;
    }

    return (
        <main className={styles.main} style={ESHIRITORI_THEME}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <IconBack size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>🎨</span>
                        <h1>絵しりとり</h1>
                    </div>
                </div>
                <div className={styles.userInfo}>
                    <IconUser size={20} />
                    <span>{playerName || user.displayName}</span>
                </div>
            </div>

            <div className={styles.content}>
                {view === 'menu' && (
                    <div className={styles.menuContainer}>
                        <div
                            className={`${styles.menuCard} ${styles.menuCardRandom}`}
                            onClick={() => setView('game_create')}
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        >
                            <div className={styles.menuIconWrapper}>
                                <IconPlus size={32} />
                            </div>
                            <div className={styles.menuContent}>
                                <h2 className={styles.menuTitle}>ルーム作成</h2>
                                <p className={styles.menuDescription}>
                                    新しいルームを作成して友達を招待
                                </p>
                            </div>
                        </div>

                        <div
                            className={`${styles.menuCard} ${styles.menuCardRoom}`}
                            onClick={() => setView('input_room')}
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                            <div className={styles.menuIconWrapper}>
                                <IconDoorEnter size={32} />
                            </div>
                            <div className={styles.menuContent}>
                                <h2 className={styles.menuTitle}>ルーム参加</h2>
                                <p className={styles.menuDescription}>
                                    ルームIDを入力して参加
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'input_room' && (
                    <div className={styles.inputCard}>
                        <h2 className={styles.inputTitle}>ルームに参加</h2>
                        <input
                            value={targetRoomId}
                            onChange={(e) => setTargetRoomId(e.target.value)}
                            placeholder="ルームIDを入力"
                            className={styles.roomInput}
                        />
                        <button
                            onClick={() => targetRoomId && setView('game_join')}
                            className={`${styles.actionBtn} ${styles.btnJoin}`}
                            disabled={!targetRoomId}
                        >
                            <IconDoorEnter size={20} /> 参加する
                        </button>
                        <button
                            onClick={() => setView('menu')}
                            className={`${styles.actionBtn} ${styles.btnSecondary}`}
                        >
                            <IconBack size={20} /> キャンセル
                        </button>
                    </div>
                )}

                {view === 'menu' && (
                    <div className={styles.contentSection} style={{ marginTop: '3rem' }}>
                        <h2 className={styles.contentTitle}>絵しりとりの遊び方</h2>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🎨</span>
                                <h3 className={styles.sectionTitle}>ゲームの流れ</h3>
                            </div>
                            <p className={styles.textBlock}>
                                1. 最初の人がお題を見て絵を描きます<br />
                                2. 次の人は絵を見て、それが何かを推測して入力<br />
                                3. 推測した言葉を元に、しりとりで続く絵を描きます<br />
                                4. 全員が描き終わったら結果発表！
                            </p>
                        </div>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>✨</span>
                                <h3 className={styles.sectionTitle}>ポイント</h3>
                            </div>
                            <div className={styles.cardGrid}>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>伝わる絵を描こう</span>
                                    <p className={styles.cardText}>
                                        次の人に伝わるように、特徴を捉えた絵を描きましょう！
                                    </p>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>しりとりを繋げよう</span>
                                    <p className={styles.cardText}>
                                        推測した言葉の最後の文字から始まる言葉を描きます。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
