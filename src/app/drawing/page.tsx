'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../trump/page.module.css'; // Reuse trump styles for consistency
import { db } from '@/lib/firebase';
import { ref, set, push, onValue } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { IconUser, IconPlus, IconBack, IconPalette } from '@/components/Icons';

interface DrawingRoom {
    id: string;
    name: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    players: Record<string, any>;
    createdAt: number;
}

import { useRoomJanitor } from '@/hooks/useRoomJanitor';

export default function DrawingLobbyPage() {
    const router = useRouter();
    const { playerName, playerId, isLoaded } = usePlayer();
    const [rooms, setRooms] = useState<DrawingRoom[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

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
        if (!newRoomName.trim() || !playerId || !playerName) return;
        setIsCreating(true);

        try {
            const roomsRef = ref(db, 'drawing_rooms');
            const newRoomRef = push(roomsRef);
            const roomId = newRoomRef.key;

            if (roomId) {
                await set(newRoomRef, {
                    id: roomId,
                    name: newRoomName,
                    hostId: playerId,
                    status: 'waiting',
                    createdAt: Date.now(),
                    players: {
                        [playerId]: {
                            id: playerId,
                            name: playerName,
                            score: 0,
                            isDrawer: false
                        }
                    }
                });
                router.push(`/drawing/${roomId}`);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isLoaded) return <div className={styles.loading}>読み込み中...</div>;

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
                    <span>{playerName}</span>
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
                                <div key={room.id} className={styles.roomCard} onClick={() => router.push(`/drawing/${room.id}`)}>
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
        </main>
    );
}
