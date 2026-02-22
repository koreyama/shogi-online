'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/trump/page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconUser } from '@/components/Icons';
import HideChatBot from '@/components/HideChatBot';
import dynamic from 'next/dynamic';

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

interface DrawingRoomData {
    roomId: string;
    hostId: string;
    hostName: string;
    status: string;
    playerCount: number;
    isLocked: boolean;
    gameMode: string;
    createdAt: number;
}

export default function DrawingLobby() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName } = usePlayer();

    const [rooms, setRooms] = useState<DrawingRoomData[]>([]);
    const [gameActive, setGameActive] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [creationOptions, setCreationOptions] = useState<any>(null);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Room fetching
    useEffect(() => {
        const roomsRef = ref(db, 'drawing_rooms');

        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            const roomList: DrawingRoomData[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    const r = data[key];
                    if (r && r.status === 'waiting') {
                        roomList.push({ roomId: key, ...r });
                    }
                });
            }
            // Sort by createdAt descending
            roomList.sort((a, b) => b.createdAt - a.createdAt);
            setRooms(roomList);
        }, (error) => {
            console.error("Firebase Read Error:", error);
        });

        return () => unsubscribe();
    }, []);

    const startCreate = () => {
        setCreationOptions({ create: true });
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
                <ColyseusDrawingGame
                    playerId={user.uid}
                    playerName={playerName || user.displayName || 'Guest'}
                    mode={creationOptions?.create ? 'room' : 'room'} // Technically we use 'room' mode for both in DrawingGame, create generates an ID empty string or handled by Colyseus wrapper
                    roomId={creationOptions?.roomId} // Undefined roomId means create new
                    onBack={handleExit}
                />
            </>
        );
    }

    return (
        <main className={styles.main} style={DRAWING_THEME}>
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={20} /> ホームに戻る
                </button>
                <h1 className={styles.title}>🎨 お絵かきクイズ</h1>
                <div style={{ width: 100 }}></div>
            </header>

            <div className={styles.content}>
                <section className={styles.leftPanel}>
                    <h2 className={styles.sectionTitle}>ルーム作成 / 参加</h2>

                    <div className={styles.createForm}>
                        <h3 className={styles.subTitle}>新規ルーム作成</h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                            友達を招待してプライベートに遊ぶ部屋を作成します。
                        </p>
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
                                    placeholder="ルームIDを入力"
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
                                            <span className={styles.roomName}>ROOM: {room.roomId.substring(0, 8)}...</span>
                                            {room.isLocked && <span className={styles.lockedBadge}>🔒 KEY</span>}
                                        </div>
                                        <div className={styles.roomDetails}>
                                            <span>ホスト: {room.hostName}</span>
                                            <span>モード: {room.gameMode === 'free' ? '🎨 フリー' : '❓ クイズ'}</span>
                                            <span><IconUser size={14} /> {room.playerCount}/6</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCreationOptions({ roomId: room.roomId });
                                            setGameActive(true);
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
            </div>
        </main>
    );
}
