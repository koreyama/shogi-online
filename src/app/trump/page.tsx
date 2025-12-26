'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { TrumpRoom } from '@/lib/trump/types';
import { IconBack, IconCards, IconUser } from '@/components/Icons';
import { ColyseusDaifugoGame } from './ColyseusDaifugoGame';
import { useRoomJanitor } from '@/hooks/useRoomJanitor';

export default function TrumpLobbyPage() {
    const router = useRouter();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();

    // UI State (Daifugo Only)
    const [rooms, setRooms] = useState<TrumpRoom[]>([]);

    // Colyseus State
    const [colyseusGameActive, setColyseusGameActive] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [creationOptions, setCreationOptions] = useState<any>(null);

    // Clean up empty trump rooms
    useRoomJanitor(['trump']);

    // Room Fetching (Daifugo Only)
    useEffect(() => {
        const path = 'trump_rooms';
        console.log('TrumpLobbyPage: Fetching rooms from', path);
        const roomsRef = ref(db, path);

        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            // console.log("Firebase Fetch:", path, data);

            const roomList: TrumpRoom[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    const r = data[key];
                    // Only show waiting rooms
                    if (r && r.status === 'waiting') {
                        roomList.push({ roomId: key, ...r });
                    }
                });
            }
            // console.log("Parsed Room List:", roomList);
            setRooms(roomList);
        }, (error) => {
            console.error("Firebase Read Error:", error);
        });

        return () => unsubscribe();
    }, []);

    // --- Colyseus Handlers ---
    const startColyseusCreate = () => {
        // Pass password from creationOptions if set
        setCreationOptions({ create: true, password: creationOptions?.password });
        setColyseusGameActive(true);
    };

    const startColyseusJoin = () => {
        if (!joinRoomId) return;
        setCreationOptions({ roomId: joinRoomId });
        setColyseusGameActive(true);
    };

    const handleExitGame = () => {
        setColyseusGameActive(false);
        setCreationOptions(null);
    };

    if (authLoading) return <div className={styles.loading}>読み込み中...</div>;

    // Login Check
    if (!user) {
        return (
            <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <IconCards size={64} color="#2b6cb0" />
                    <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>大富豪 Online</h1>
                    <p style={{ color: '#718096', marginBottom: '1.5rem' }}>プレイするにはログインが必要です</p>
                    <button onClick={signInWithGoogle} className={styles.loginBtn}>Googleでログイン</button>
                </div>
            </main>
        );
    }

    // Active Game View
    if (colyseusGameActive && user) {
        return (
            <ColyseusDaifugoGame
                roomId={creationOptions?.roomId}
                options={creationOptions}
                onLeave={handleExitGame}
                myPlayerId={user.uid}
                myPlayerName={user.displayName || 'Guest'}
            />
        );
    }

    // Lobby View
    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={20} /> ホームに戻る
                </button>
                <h1 className={styles.title}>大富豪 Online</h1>
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
                                onChange={(e) => setCreationOptions({ ...creationOptions, password: e.target.value })}
                            />
                        </div>
                        <button onClick={startColyseusCreate} className={styles.createButton}>
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
                                <button onClick={startColyseusJoin} className={styles.joinButton}>
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
                                            <span>ホスト: {room.players ? Object.values(room.players).find(p => p.role === 'host')?.name : 'Unknown'}</span>
                                            <span><IconUser size={14} /> {room.players ? Object.keys(room.players).length : 0}/6</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (room.isLocked) {
                                                const pwd = prompt("パスワードを入力してください:");
                                                if (pwd !== null) {
                                                    setJoinRoomId(room.roomId);
                                                    setCreationOptions({ roomId: room.roomId, password: pwd });
                                                    setColyseusGameActive(true);
                                                }
                                            } else {
                                                setJoinRoomId(room.roomId);
                                                setCreationOptions({ roomId: room.roomId });
                                                setColyseusGameActive(true);
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
                <h2 className={styles.contentTitle}>大富豪（大貧民）の遊び方</h2>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>👑</div>
                        <h3 className={styles.sectionTitle}>日本で最も愛されるカードゲーム</h3>
                    </div>
                    <p className={styles.textBlock}>
                        大富豪は、手札をいかに早く出し切るかを競うゲームです。
                        階級制度（大富豪、富豪、平民、貧民、大貧民）があり、順位によって次回のゲームで有利不利が決まるのが特徴です。
                        オンラインで最大6人まで同時にプレイ可能です。
                    </p>
                </div>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>📜</div>
                        <h3 className={styles.sectionTitle}>採用している主要ルール</h3>
                    </div>
                    <div className={styles.cardGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>革命</span>
                            <p className={styles.cardText}>同じ数字を4枚出すと、カードの強さが逆転します（3が最強、2が最弱になります）。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>8切り</span>
                            <p className={styles.cardText}>8を含むカードを出すと、その場で場が流れます（強制的に自分の番になります）。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>都落ち</span>
                            <p className={styles.cardText}>大富豪が1位になれなかった場合、即座に大貧民に転落してゲームから脱落します。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>スぺ3返し</span>
                            <p className={styles.cardText}>ジョーカーが1枚出しされた時、スペードの3で返すことができます。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>階段</span>
                            <p className={styles.cardText}>同じマークで連続した数字（例：♠3, ♠4, ♠5）をまとめて出すことができます。</p>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>縛り（激森）</span>
                            <p className={styles.cardText}>同じマークが連続して出された場合、そのマークしか出せなくなります。</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
