'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/trump/page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconUser, IconRocket, IconCpu } from '@/components/Icons';
import HideChatBot from '@/components/HideChatBot';
import dynamic from 'next/dynamic';

const LoadingSpinner = () => (
    <div className={styles.main} style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', height: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: 50, height: 50, border: '4px solid #e2e8f0',
                borderTopColor: '#3b82f6', borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ color: '#3b82f6' }}>読み込み中...</h2>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    </div>
);

const QuizGame = dynamic(() => import('./QuizGame'), {
    ssr: false,
    loading: () => <LoadingSpinner />
});

const QuizPracticeGame = dynamic(() => import('./QuizPracticeGame'), {
    ssr: false,
    loading: () => <LoadingSpinner />
});

const QUIZ_THEME = {
    '--theme-primary': '#3b82f6',
    '--theme-secondary': '#2563eb',
    '--theme-tertiary': '#60a5fa',
    '--theme-bg-light': '#eff6ff',
    '--theme-text-title': 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
} as React.CSSProperties;

interface QuizRoomInfo {
    roomId: string;
    hostId: string;
    hostName: string;
    status: 'waiting' | 'playing';
    playerCount: number;
    isLocked: boolean;
    createdAt: number;
    genre?: string;
}

export default function QuizLobby() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName } = usePlayer();

    const [rooms, setRooms] = useState<QuizRoomInfo[]>([]);
    const [gameActive, setGameActive] = useState(false);
    const [practiceActive, setPracticeActive] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [creationOptions, setCreationOptions] = useState<any>(null);
    const [password, setPassword] = useState('');

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Room fetching
    useEffect(() => {
        if (gameActive) return;

        const roomsRef = ref(db, 'quiz_rooms');

        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            const roomList: QuizRoomInfo[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    const r = data[key];
                    if (r && r.status === 'waiting') {
                        roomList.push({ roomId: key, ...r });
                    }
                });
            }
            setRooms(roomList);
        }, (error) => {
            // Silently ignore or warn
            console.warn("Firebase Read Warning:", error);
        });

        return () => {
            try {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            } catch (e) {
                // Ignore unsubscribe errors during unmount/cleanup
            }
        };
    }, [gameActive]);

    const startCreate = () => {
        setCreationOptions({ create: true, password: password || undefined });
        setGameActive(true);
    };

    const startJoin = () => {
        if (!joinRoomId) return;
        setCreationOptions({ roomId: joinRoomId });
        setGameActive(true);
    };

    const handleExit = () => {
        setGameActive(false);
        setPracticeActive(false);
        setCreationOptions(null);
        setJoinRoomId('');
    };

    if (authLoading || !user) return <LoadingSpinner />;

    if (practiceActive) {
        return <QuizPracticeGame onBack={handleExit} />;
    }

    if (gameActive && user) {
        return (
            <>
                <HideChatBot />
                <QuizGame
                    userData={{ name: playerName || user.displayName || 'Guest', id: user.uid }}
                    mode={creationOptions?.create ? 'create' : 'join'}
                    roomId={creationOptions?.roomId}
                    password={creationOptions?.password}
                    onBack={handleExit}
                />
            </>
        );
    }

    return (
        <main className={styles.main} style={QUIZ_THEME}>
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={20} /> ホームに戻る
                </button>
                <h1 className={styles.title}>💡 Quiz Battle</h1>
                <div style={{ width: 100 }}></div>
            </header>

            <div className={styles.content}>
                <section className={styles.leftPanel}>
                    <h2 className={styles.sectionTitle}>ルーム作成 / 参加</h2>

                    {/* Practice Mode Button */}
                    <div style={{ marginBottom: '2rem' }}>
                        <button
                            onClick={() => setPracticeActive(true)}
                            className={styles.roomCard}
                            style={{ width: '100%', justifyContent: 'center', background: '#e0f2fe', border: '2px dashed #7dd3fc', padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#0369a1', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                <IconCpu size={24} />
                                練習モードで遊ぶ (1人)
                            </div>
                        </button>
                    </div>

                    <div className={styles.createForm}>
                        <h3 className={styles.subTitle}>新規ルーム作成</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>パスワード (任意)</label>
                            <input
                                type="password"
                                placeholder="設定しない場合は空欄"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button onClick={startCreate} className={styles.createButton}>
                            ルームを作成
                        </button>

                        <div className={styles.divider}>
                            <span>OR</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>ルームIDで参加</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value)}
                                    placeholder="ルームID"
                                    className={styles.input}
                                    style={{ flex: 1 }}
                                />
                                <button onClick={startJoin} className={styles.joinButton}>
                                    参加
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.rightPanel}>
                    <h2 className={styles.sectionTitle}>待機中のルーム</h2>
                    <div className={styles.roomList}>
                        {rooms.length === 0 ? (
                            <div className={styles.emptyState}>
                                現在待機中のルームはありません。
                            </div>
                        ) : (
                            rooms.map(room => (
                                <div key={room.roomId} className={styles.roomCard}>
                                    <div className={styles.roomInfo}>
                                        <div className={styles.roomHeader}>
                                            <span className={styles.roomName}>ROOM: {room.roomId}</span>
                                            {room.isLocked && <span className={styles.lockedBadge}>🔒 KEY</span>}
                                            {room.genre && room.genre !== "すべて" && (
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    background: '#dbeafe',
                                                    color: '#1e40af',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    marginLeft: '8px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {room.genre}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.roomDetails}>
                                            <span>ホスト: {room.hostName}</span>
                                            <span><IconUser size={14} /> {room.playerCount}/6</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (room.isLocked) {
                                                const pwd = prompt("パスワードを入力してください:");
                                                if (pwd !== null) {
                                                    setCreationOptions({ roomId: room.roomId, password: pwd });
                                                    setGameActive(true);
                                                }
                                            } else {
                                                setCreationOptions({ roomId: room.roomId });
                                                setGameActive(true);
                                            }
                                        }}
                                        className={styles.joinButton}
                                    >
                                        参加
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className={styles.descriptionSection}>
                <h2 className={styles.contentTitle}>クイズバトルのルール</h2>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>⚡</div>
                        <h3 className={styles.sectionTitle}>早押し・文字入力バトル</h3>
                    </div>
                    <p className={styles.textBlock}>
                        出題されるクイズの答えを、文字パネルから選んで入力しよう。<br />
                        早く正解するほど高得点がもらえるぞ！
                    </p>
                </div>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>🏆</div>
                        <h3 className={styles.sectionTitle}>勝利条件</h3>
                    </div>
                    <p className={styles.textBlock}>
                        全10問終了時点で、最もスコアが高いプレイヤーが勝利！<br />
                        スピードと正確さが鍵となる。
                    </p>
                </div>
            </div>
        </main>
    );
}
