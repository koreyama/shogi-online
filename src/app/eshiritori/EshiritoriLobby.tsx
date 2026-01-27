'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/trump/page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { IconBack, IconUser } from '@/components/Icons';
import HideChatBot from '@/components/HideChatBot';
import dynamic from 'next/dynamic';

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

interface EshiritoriRoom {
    roomId: string;
    hostId: string;
    hostName: string;
    status: string;
    playerCount: number;
    isLocked: boolean;
    createdAt: number;
}

export default function EshiritoriLobby() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [rooms, setRooms] = useState<EshiritoriRoom[]>([]);
    const [gameActive, setGameActive] = useState(false);
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
        const roomsRef = ref(db, 'eshiritori_rooms');

        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            const roomList: EshiritoriRoom[] = [];
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
            console.error("Firebase Read Error:", error);
        });

        return () => unsubscribe();
    }, []);

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
        setCreationOptions(null);
        setJoinRoomId('');
    };

    if (authLoading || !user) return <div className={styles.loading}>読み込み中...</div>;

    if (gameActive && user) {
        return (
            <>
                <HideChatBot />
                <ColyseusEshiritoriGame
                    playerId={user.uid}
                    playerName={user.displayName || (user.email ? user.email.split('@')[0] : 'Guest')}
                    mode={creationOptions?.create ? 'create' : 'join'}
                    roomId={creationOptions?.roomId}
                    password={creationOptions?.password}
                    onBack={handleExit}
                />
            </>
        );
    }

    return (
        <main className={styles.main} style={ESHIRITORI_THEME}>
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={20} /> ホームに戻る
                </button>
                <h1 className={styles.title}>🎨 絵しりとり</h1>
                <div style={{ width: 100 }}></div>
            </header>

            <div className={styles.content}>
                <section className={styles.leftPanel}>
                    <h2 className={styles.sectionTitle}>ルーム作成 / 参加</h2>

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
                                        </div>
                                        <div className={styles.roomDetails}>
                                            <span>ホスト: {room.hostName}</span>
                                            <span><IconUser size={14} /> {room.playerCount}/8</span>
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
                <h2 className={styles.contentTitle}>絵しりとりの遊び方</h2>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>🎨</div>
                        <h3 className={styles.sectionTitle}>絵で繋ぐしりとりゲーム</h3>
                    </div>
                    <p className={styles.textBlock}>
                        絵しりとりは、前の人が描いた絵を見て何かを推測し、その言葉から始まる新しい言葉を絵で描いていくゲームです。
                        最後に全員の絵と推測を公開して、どれだけ正確に伝わったかを楽しみます。
                    </p>
                </div>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>📜</div>
                        <h3 className={styles.sectionTitle}>ゲームの流れ</h3>
                    </div>
                    <div className={styles.cardGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>1. お題を確認</span>
                            <p className={styles.cardText}>最初のプレイヤーにお題が表示されます。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>2. 絵を描く</span>
                            <p className={styles.cardText}>60秒以内にお題を絵で表現します。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>3. 推測する</span>
                            <p className={styles.cardText}>次の人は絵を見て何かを推測して入力します。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>4. 結果発表</span>
                            <p className={styles.cardText}>全員の絵と回答を確認して盛り上がりましょう！</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
