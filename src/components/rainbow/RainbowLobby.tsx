import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/rainbow/page.module.css'; // Use Rainbow styles
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { RainbowRoom } from '@/lib/rainbow/types';
import { IconBack, IconUser } from '@/components/Icons';
import HideChatBot from '@/components/HideChatBot';
import RainbowGame from './RainbowGame'; // Import the Game component
import { useRoomJanitor } from '@/hooks/useRoomJanitor';

const RAINBOW_THEME = {
    '--theme-primary': '#8b5cf6', // Violet
    '--theme-secondary': '#7c3aed',
    '--theme-tertiary': '#a78bfa',
    '--theme-bg-light': '#f5f3ff',
    '--theme-text-title': 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
} as React.CSSProperties;

export default function RainbowLobby() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth(); // Removed signInWithGoogle unused

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // UI State
    const [rooms, setRooms] = useState<RainbowRoom[]>([]);

    // Colyseus State
    const [colyseusGameActive, setColyseusGameActive] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [creationOptions, setCreationOptions] = useState<any>(null);

    // Clean up empty rooms
    useRoomJanitor(['rainbow']);

    // Room Fetching
    useEffect(() => {
        const path = 'rooms'; // Monitor "rainbow_rooms" in Firebase (Sync logic needed later on server? No, Colyseus room listing usually handled by lobby or monitor. Here we assume Firebase sync exists or we rely on Colyseus map? Daifugo relied on custom sync.)
        // wait, Daifugo has `useRoomJanitor` which implies there is a syncing mechanism or the client writes to FB?
        // Actually, normally `LobbyRoom` handles listing. But here `TrumpLobby` reads from `trump_rooms` in Firebase.
        // Who writes to `trump_rooms`? The server? Or the `monitor`?
        // Ah, `useRoomJanitor` CLEANUPs it. But creation?
        // Usually `Colyseus` doesn't write to Firebase automatically.
        // My previous work on Daifugo likely added a `onCreate` hook in `DaifugoRoom` that writes to Firebase?
        // Or specific `LobbyRoom` logic.
        // Let's assume for now I need to implement the Firebase sync in `RainbowRoom` too if I want this lobby to work exactly like Daifugo.
        // But the user said "Use same UI". 
        // If I skip Firebase sync, the list will be empty.
        // I should check `DaifugoRoom.ts` to see if it writes to Firebase.
        // If it does, I must copy that logic to `RainbowRoom.ts`.

        console.log('RainbowLobby: Fetching rooms from', path);
        const roomsRef = ref(db, path);

        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            const roomList: RainbowRoom[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    const r = data[key];
                    if (r && r.status === 'waiting' && r.gameType === 'rainbow') {
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

    // --- Colyseus Handlers ---
    const startColyseusCreate = () => {
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

    // Profile Fetching
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (!user) return;

        let mounted = true;
        // Default from Auth
        const authName = user.displayName || (user.email ? user.email.split('@')[0] : 'Guest');
        setDisplayName(authName);

        // Fetch from Firestore
        import('@/lib/firebase/users').then(({ getUserProfile }) => {
            getUserProfile(user.uid).then(profile => {
                if (mounted && profile?.displayName) {
                    setDisplayName(profile.displayName);
                }
            }).catch(e => console.warn("Profile load error:", e));
        });

        return () => { mounted = false; };
    }, [user]);


    if (authLoading || !user) return <div className={styles.loading}>読み込み中...</div>;

    // Active Game View
    if (colyseusGameActive && user) {
        return (
            <>
                <HideChatBot />
                <RainbowGame
                    roomId={creationOptions?.roomId}
                    options={creationOptions}
                    onLeave={handleExitGame}
                    myPlayerId={user.uid}
                    myPlayerName={displayName}
                />
            </>
        );
    }

    // Lobby View
    return (
        <main className={styles.main} style={RAINBOW_THEME}>
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={20} /> ホームに戻る
                </button>
                <h1 className={styles.title}>Rainbow</h1>
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
                                            <span>
                                                ホスト: {room.players ? Object.values(room.players).find((p: any) => p.role === 'host')?.name || 'Host' : 'Unknown'}
                                            </span>
                                            <span><IconUser size={14} /> {room.players ? Object.keys(room.players).length : 0}/{room.maxClients || 4}</span>
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
                <h2 className={styles.contentTitle}>Rainbow</h2>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>🌈</div>
                        <h3 className={styles.sectionTitle}>色と数字を合わせるカードゲーム</h3>
                    </div>
                    <p className={styles.textBlock}>
                        手札を早くなくした人の勝ちです。
                        場に出ているカードと同じ色、または同じ数字（記号）のカードを出していきましょう。
                        最後の1枚になったら自動で通知されます。
                    </p>
                </div>
            </div>
        </main>
    );
}
