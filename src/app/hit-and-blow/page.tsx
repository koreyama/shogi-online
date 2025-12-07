'use client';

import React, { useState, useEffect } from 'react';
import HitAndBlowGame from './HitAndBlowGame';
import menuStyles from '@/styles/GameMenu.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, set, push, get, update, onDisconnect } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { useRouter } from 'next/navigation';

export default function HitAndBlowPage() {
    const router = useRouter();
    const { playerName, savePlayerName, isLoaded: nameLoaded } = usePlayer();
    const [gameMode, setGameMode] = useState<'menu' | 'ai' | 'random' | 'room' | 'playing' | 'setup'>('setup');
    const [customRoomId, setCustomRoomId] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<'P1' | 'P2' | null>(null);

    useEffect(() => {
        if (nameLoaded && playerName) {
            setGameMode('menu');
        } else if (nameLoaded && !playerName) {
            setGameMode('setup');
        }
    }, [nameLoaded, playerName]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = (e.target as any).playerName.value;
        if (name) {
            savePlayerName(name);
            setGameMode('menu');
        }
    };

    const handleBackToMenu = () => {
        setGameMode('menu');
        setRoomId(null);
        setMyRole(null);
    };

    const handleStartAI = () => {
        setGameMode('ai');
    };

    const joinRandomGame = async () => {
        setGameMode('random'); // Waiting screen
        const roomsRef = ref(db, 'hit_and_blow_rooms');
        const snap = await get(roomsRef);
        const rooms = snap.val();
        let found = null;

        if (rooms) {
            for (const [rid, r] of Object.entries(rooms) as [string, any][]) {
                if (r.state === 'waiting' && ((r.P1 && !r.P2) || (!r.P1 && r.P2))) {
                    found = rid;
                    break;
                }
            }
        }

        if (found) {
            const role = rooms[found].P1 ? 'P2' : 'P1';
            await update(ref(db, `hit_and_blow_rooms/${found}/${role}`), { name: playerName, status: 'waiting' });
            // Start game trigger handled in Game? Game Component doesn't auto-start, it syncs.
            // We need to set state to playing? Or just render Game with roomId.
            // Actually, we update DB state to 'playing' if full?
            if (role === 'P2') {
                await update(ref(db, `hit_and_blow_rooms/${found}`), { state: 'playing' });
            }
            setRoomId(found);
            setMyRole(role);
            setGameMode('playing');
        } else {
            const newRef = push(roomsRef);
            // We should generate secret HERE or in Game?
            // If we use Game component, P1 should gen secret on mount if room is new?
            // HitAndBlowGame component handles Secret gen if P1.
            await set(newRef, {
                P1: { name: playerName, status: 'waiting' },
                state: 'waiting',
                turn: 'P1',
                history: []
            });
            setRoomId(newRef.key);
            setMyRole('P1');
            setGameMode('playing'); // Or 'waiting'? Game component handles "Waiting for Opponent"?
            // We can show waiting screen until P2 joins, but since we have "Turn Based", P1 can move immediately?
            // Actually, usually wait for P2.
            // But let's simplify and go straight to Game, showing "Waiting for Opponent" inside.
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        const rid = customRoomId.trim();
        const roomRef = ref(db, `hit_and_blow_rooms/${rid}`);
        const snapshot = await get(roomRef);
        const room = snapshot.val();

        if (!room) {
            await set(roomRef, {
                P1: { name: playerName, status: 'waiting' },
                state: 'waiting',
                turn: 'P1',
                history: []
            });
            setRoomId(rid);
            setMyRole('P1');
            setGameMode('playing');
        } else if (!room.P2) {
            await update(ref(db, `hit_and_blow_rooms/${rid}`), {
                state: 'playing',
                P2: { name: playerName, status: 'waiting' }
            });
            setRoomId(rid);
            setMyRole('P2');
            setGameMode('playing');
        } else {
            alert('満員です');
        }
    };

    // Render Setup
    if (gameMode === 'setup') {
        return (
            <main className={menuStyles.container}>
                <div className={menuStyles.header}>
                    <h1 className={menuStyles.title}>Hit & Blow</h1>
                </div>
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <form onSubmit={handleNameSubmit} className={menuStyles.setupForm}>
                        <input name="playerName" defaultValue={playerName} placeholder="プレイヤー名" className={menuStyles.input} required />
                        <button type="submit" className={menuStyles.primaryBtn} style={{ width: '100%' }}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // Render Game (AI or Multiplayer)
    if (gameMode === 'ai' || gameMode === 'playing') {
        return (
            <main className={menuStyles.container}>
                <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ padding: '0 0 1rem', width: '100%' }}>
                        <button onClick={handleBackToMenu} className={menuStyles.backButton} style={{}}>
                            <IconBack size={20} /> メニューへ戻る (退出)
                        </button>
                    </div>
                    {/* Render Game */}
                    <HitAndBlowGame
                        roomId={roomId}
                        myRole={myRole}
                    />
                </div>
            </main>
        );
    }

    // Render Menu & Join UI
    return (
        <main className={menuStyles.container}>
            <>
                <div className={menuStyles.header}>
                    <Link href="/" className={menuStyles.backButton}>
                        <IconBack size={20} /> トップへ戻る
                    </Link>
                    <h1 className={menuStyles.title}>Hit & Blow</h1>
                    <p className={menuStyles.subtitle}>数字を当てて脳を活性化！</p>
                </div>

                {gameMode === 'menu' ? (
                    <div className={menuStyles.modeSelection}>
                        <button onClick={() => setGameMode('ai')} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconRobot size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ソロプレイ</span>
                            <span className={menuStyles.modeBtnDesc}>1人でじっくり練習</span>
                        </button>
                        <button onClick={joinRandomGame} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconDice size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ランダム対戦</span>
                            <span className={menuStyles.modeBtnDesc}>交互に推理して正解を競う</span>
                        </button>
                        <button onClick={() => setGameMode('room')} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconKey size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={menuStyles.modeBtnDesc}>友達と同じ数字（シークレット）を解く</span>
                        </button>
                    </div>
                ) : (
                    // Join Section (Random or Room)
                    <div className={menuStyles.joinSection}>
                        {gameMode === 'random' ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <IconDice size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                                <p className={menuStyles.joinDesc}>マッチング中...</p>
                            </div>
                        ) : (
                            // Room Mode
                            <>
                                <p className={menuStyles.joinDesc}>
                                    ルームIDを入力して参加・作成
                                </p>
                                <input
                                    type="text"
                                    placeholder="ルームID (例: 1234)"
                                    className={menuStyles.input}
                                    value={customRoomId}
                                    onChange={(e) => setCustomRoomId(e.target.value)}
                                    style={{ marginBottom: '1rem' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                                    <button onClick={joinRoomGame} className={menuStyles.primaryBtn} disabled={!customRoomId}>参加 / 作成</button>
                                    <button onClick={() => setGameMode('menu')} className={menuStyles.secondaryBtn}>戻る</button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </>
        </main >
    );
}
