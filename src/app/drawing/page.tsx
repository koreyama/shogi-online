'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { IconUser, IconPlus, IconBack, IconPalette } from '@/components/Icons';
import { useRoomJanitor } from '@/hooks/useRoomJanitor';
import dynamic from 'next/dynamic';

// Dynamically load the game content to avoid SSR issues
const DrawingGameContent = dynamic(() => import('@/components/drawing/DrawingGameContent'), {
    ssr: false,
    loading: () => (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f3f4f6',
            color: '#6b7280',
            fontSize: '1.2rem'
        }}>
            読み込み中...
        </div>
    )
});

interface DrawingRoom {
    id: string;
    name: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    players: Record<string, any>;
    createdAt: number;
}

export default function DrawingPage() {
    const router = useRouter();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const [rooms, setRooms] = useState<DrawingRoom[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // This is the key state - when set, we show the game instead of lobby
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

    // Clean up empty drawing rooms
    useRoomJanitor(['drawing']);

    useEffect(() => {
        const roomsRef = ref(db, 'drawing_rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            const roomList: DrawingRoom[] = [];
            if (data) {
                Object.entries(data).forEach(([key, value]: [string, any]) => {
                    roomList.push({ id: key, ...value });
                });
            }
            // Sort by newest first
            roomList.sort((a, b) => b.createdAt - a.createdAt);
            setRooms(roomList);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !user) return;
        setIsCreating(true);

        try {
            const roomsRef = ref(db, 'drawing_rooms');
            const newRoomRef = push(roomsRef);
            const roomId = newRoomRef.key;

            if (roomId) {
                await set(newRoomRef, {
                    id: roomId,
                    name: newRoomName,
                    hostId: user.uid,
                    status: 'waiting',
                    createdAt: Date.now(),
                    players: {
                        [user.uid]: {
                            id: user.uid,
                            name: user.displayName || 'Guest',
                            score: 0,
                            isDrawer: false
                        }
                    }
                });
                // Instead of navigating, just set the active room
                setActiveRoomId(roomId);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = (roomId: string) => {
        setActiveRoomId(roomId);
    };

    const handleExitGame = () => {
        setActiveRoomId(null);
        setNewRoomName('');
    };

    if (authLoading) return <div className={styles.loading}>読み込み中...</div>;

    // Login required screen
    if (!user) {
        return (
            <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <IconPalette size={64} color="#d53f8c" />
                    <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>お絵かきクイズ</h1>
                    <p style={{ color: '#718096', marginBottom: '1.5rem' }}>プレイするにはログインが必要です</p>
                    <button
                        onClick={signInWithGoogle}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#3182ce',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    >
                        Googleでログイン
                    </button>
                </div>
            </main>
        );
    }

    // If in a game room, show the game content
    if (activeRoomId) {
        return <DrawingGameContent roomId={activeRoomId} onExit={handleExitGame} />;
    }

    // Lobby view
    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => router.push('/')} className={styles.backButton} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
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
                <div className={styles.createSection}>
                    <h2>ルーム作成</h2>
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="ルーム名を入力"
                            maxLength={20}
                        />
                        <button
                            onClick={handleCreateRoom}
                            disabled={!newRoomName.trim() || isCreating}
                            className={styles.createButton}
                        >
                            <IconPlus size={20} />
                            作成
                        </button>
                    </div>
                </div>

                <div className={styles.roomListSection}>
                    <h2>ルーム一覧</h2>
                    <div className={styles.roomGrid}>
                        {rooms.length === 0 ? (
                            <div className={styles.noRooms}>ルームがありません。作成してください。</div>
                        ) : (
                            rooms.map(room => (
                                <div key={room.id} className={styles.roomCard} onClick={() => handleJoinRoom(room.id)}>
                                    <div className={styles.roomHeader}>
                                        <h3>{room.name}</h3>
                                        <span className={`${styles.statusBadge} ${styles[room.status]}`}>
                                            {room.status === 'waiting' ? '待機中' : 'プレイ中'}
                                        </span>
                                    </div>
                                    <div className={styles.roomInfo}>
                                        <span>参加者: {room.players ? Object.keys(room.players).length : 0}人</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* AdSense Content Section */}
            <div className={styles.contentSection}>
                <h2 className={styles.contentTitle}>お絵かきクイズ（Drawing Quiz）の遊び方</h2>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>🎨</span>
                        <h3 className={styles.sectionTitle}>描いて、当てて、盛り上がろう！</h3>
                    </div>
                    <p className={styles.textBlock}>
                        お絵かきクイズは、出題されたお題に沿って絵を描き、他のプレイヤーがそれが何かを当てるパーティーゲームです。
                        絵心があってもなくても大丈夫！むしろ、予想外の絵が生まれることで場が盛り上がります。
                        チャット機能を使って、リアルタイムに回答を入力しましょう。
                    </p>
                </div>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>📏</span>
                        <h3 className={styles.sectionTitle}>基本ルール</h3>
                    </div>
                    <div className={styles.cardGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>1. 描き手（Drawer）</span>
                            <p className={styles.cardText}>ランダムに選ばれたプレイヤーがお題の絵を描きます。文字や数字を書くのは禁止です！</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>2. 回答者（Guesser）</span>
                            <p className={styles.cardText}>描き手が描いている絵を見て、チャットで答えを入力します。正解するとポイント獲得！</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>3. スコア</span>
                            <p className={styles.cardText}>早く正解するほど高得点。描き手も、誰かに正解してもらえるとポイントが入ります。</p>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>💡</span>
                        <h3 className={styles.sectionTitle}>楽しむためのコツ</h3>
                    </div>
                    <p className={styles.textBlock}>
                        上手な絵を描く必要はありません。「伝わる絵」を描くことが大切です。
                    </p>
                    <div className={styles.highlightBox}>
                        <span className={styles.highlightTitle}>特徴を捉える</span>
                        <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                            例えば「ライオン」なら「たてがみ」、「ウサギ」なら「長い耳」など、その対象の最も目立つ特徴を大きく描きましょう。
                        </p>
                    </div>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            <strong>色を使う</strong><br />
                            色は重要なヒントになります。「リンゴ」なら赤、「海」なら青を使うだけで、伝わりやすさが格段に上がります。
                        </li>
                        <li className={styles.listItem}>
                            <strong>連想ゲーム</strong><br />
                            回答者は、描かれているものから連想できる単語をどんどん入力しましょう。数打ちゃ当たる作戦も有効です！
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
