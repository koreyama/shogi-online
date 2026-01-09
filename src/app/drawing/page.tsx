'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css'; // Reuse existing styles or update
import { useAuth } from '@/hooks/useAuth';
import { IconUser, IconBack, IconPalette, IconSearch, IconPlus, IconDoorEnter } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import dynamic from 'next/dynamic';
import HideChatBot from '@/components/HideChatBot';

const ColyseusDrawingGame = dynamic(() => import('./ColyseusDrawingGame'), {
    ssr: false,
    loading: () => <div className={styles.loading}>読み込み中...</div>
});

const DRAWING_THEME = {
    '--theme-primary': '#7c3aed',
    '--theme-secondary': '#6d28d9',
    '--theme-tertiary': '#8b5cf6',
    '--theme-bg-light': '#f5f3ff',
    '--theme-text-title': 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)',
} as React.CSSProperties;

export default function DrawingPage() {
    const router = useRouter();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const { playerName } = usePlayer();

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
            playerName={playerName || user.displayName || 'Guest'}
            mode="random"
            onBack={handleExit}
        /></>;
    }

    if (view === 'game_room') {
        return <><HideChatBot /><ColyseusDrawingGame
            playerId={user.uid}
            playerName={playerName || user.displayName || 'Guest'}
            mode="room"
            roomId={targetRoomId}
            onBack={handleExit}
        /></>;
    }

    return (
        <main className={styles.main} style={DRAWING_THEME}>
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
                    <span>{playerName || user.displayName}</span>
                </div>
            </div>

            <div className={styles.content}>

                {/* Menu Section */}
                {/* Menu Section */}
                {view === 'menu' && (
                    <div className={styles.menuContainer}>
                        <div
                            className={`${styles.menuCard} ${styles.menuCardRandom}`}
                            onClick={() => setView('game_random')}
                        >
                            <div className={styles.menuIconWrapper}>
                                <IconSearch size={32} />
                            </div>
                            <div className={styles.menuContent}>
                                <h2 className={styles.menuTitle}>ランダムマッチ (Random Match)</h2>
                                <p className={styles.menuDescription}>
                                    空いている部屋を自動で探して参加します
                                </p>
                            </div>
                        </div>

                        <div
                            className={`${styles.menuCard} ${styles.menuCardRoom}`}
                            onClick={() => setView('input_room')}
                        >
                            <div className={styles.menuIconWrapper}>
                                <IconDoorEnter size={32} />
                            </div>
                            <div className={styles.menuContent}>
                                <h2 className={styles.menuTitle}>ルーム作成・参加 (Private Room)</h2>
                                <p className={styles.menuDescription}>
                                    IDを指定して友達と遊びます
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Room ID Section */}
                {view === 'input_room' && (
                    <div className={styles.inputCard}>
                        <h2 className={styles.inputTitle}>ルーム参加・作成</h2>
                        <input
                            value={targetRoomId}
                            onChange={(e) => setTargetRoomId(e.target.value)}
                            placeholder="ルームIDを入力 (空欄で新規作成)"
                            className={styles.roomInput}
                        />
                        <button
                            onClick={() => setView('game_room')}
                            className={`${styles.actionBtn} ${targetRoomId ? styles.btnJoin : styles.btnPrimary}`}
                        >
                            {targetRoomId ? <><IconDoorEnter size={20} /> 参加する</> : <><IconPlus size={20} /> 新規ルーム作成</>}
                        </button>
                        <button
                            onClick={() => setView('menu')}
                            className={`${styles.actionBtn} ${styles.btnSecondary}`}
                        >
                            <IconBack size={20} /> キャンセル
                        </button>
                    </div>
                )}

                {/* Rules Section (Keep original content) */}
                {view === 'menu' && (
                    <div className={styles.contentSection} style={{ marginTop: '3rem' }}>
                        <h2 className={styles.contentTitle}>お絵かきクイズ (Drawing Quiz) の遊び方</h2>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🎨</span>
                                <h3 className={styles.sectionTitle}>ゲームの流れ</h3>
                            </div>
                            <p className={styles.textBlock}>
                                参加者が順番に「描き手（Drawer）」となり、出されたお題の絵を描きます。
                                他のプレイヤーは「回答者（Guesser）」となり、何を描いているかをチャットで当てます。
                            </p>
                        </div>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>👥</span>
                                <h3 className={styles.sectionTitle}>役割とポイント</h3>
                            </div>
                            <div className={styles.cardGrid}>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>描き手 (Drawer)</span>
                                    <p className={styles.cardText}>
                                        ・お題を選んで絵を描きます。<br />
                                        ・制限時間内に当ててもらうとポイントが入ります。<br />
                                        ・<strong>文字や数字を書くのは禁止</strong>です！絵だけで伝えましょう。
                                    </p>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>回答者 (Guesser)</span>
                                    <p className={styles.cardText}>
                                        ・絵を見て、答えをチャットに入力します。<br />
                                        ・早く正解するほど高得点がもらえます。<br />
                                        ・ひらがな、カタカナ、漢字、どれでもOK（自動判定されます）。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🏆</span>
                                <h3 className={styles.sectionTitle}>勝利条件</h3>
                            </div>
                            <p className={styles.textBlock}>
                                全員の描き手ターンが終わった時点で、最も合計スコアが高いプレイヤーが優勝です。
                                画力だけでなく、特徴を捉えるセンスと、素早いひらめきが勝負の鍵です！
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
