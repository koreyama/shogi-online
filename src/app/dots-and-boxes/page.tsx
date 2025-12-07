'use client';

import React, { useState, useEffect } from 'react';
import DotsAndBoxesGame from './DotsAndBoxesGame';
import menuStyles from '@/styles/GameMenu.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, set, push, get, update, onDisconnect } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { useRouter } from 'next/navigation';

export default function DotsAndBoxesPage() {
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
        const roomsRef = ref(db, 'dots_and_boxes_rooms');
        const snap = await get(roomsRef);
        const rooms = snap.val();
        let foundId = null;

        if (rooms) {
            // Shogi-style: Active Cleanup & Search
            for (const [rid, r] of Object.entries(rooms) as [string, any][]) {
                // 1. Cleanup empty/broken rooms
                if (!r.P1 && !r.P2) {
                    set(ref(db, `dots_and_boxes_rooms/${rid}`), null);
                    continue;
                }

                // 2. Find valid room
                if (r.state === 'waiting') {
                    if ((r.P1 && !r.P2) || (!r.P1 && r.P2)) {
                        foundId = rid;
                        break;
                    }
                }
            }
        }

        if (foundId) {
            // Found a room: Join "Optimistically" (Simple Update)
            const room = rooms[foundId];
            let role: 'P1' | 'P2' = 'P1';

            if (!room.P1) {
                role = 'P1';
                await update(ref(db, `dots_and_boxes_rooms/${foundId}/P1`), {
                    name: playerName,
                    status: 'waiting'
                });
                await update(ref(db, `dots_and_boxes_rooms/${foundId}`), {
                    state: 'playing'
                });
            } else {
                role = 'P2';
                await update(ref(db, `dots_and_boxes_rooms/${foundId}/P2`), {
                    name: playerName,
                    status: 'waiting'
                });
                await update(ref(db, `dots_and_boxes_rooms/${foundId}`), {
                    state: 'playing'
                });
            }

            setRoomId(foundId);
            setMyRole(role);
            setGameMode('playing');
        } else {
            // Create New Room
            const newRef = push(roomsRef);

            // Initial Game State
            const ROWS = 6;
            const COLS = 6;
            const hLines = Array(ROWS).fill(null).map(() => Array(COLS - 1).fill(false));
            const vLines = Array(ROWS - 1).fill(null).map(() => Array(COLS).fill(false));
            const boxes = Array(ROWS - 1).fill(null).map(() => Array(COLS - 1).fill(null));

            await set(newRef, {
                P1: { name: playerName, status: 'waiting' },
                state: 'waiting',
                gameState: {
                    hLines,
                    vLines,
                    boxes,
                    currentPlayer: 1,
                    scores: { 1: 0, 2: 0 },
                    winner: null,
                    lastCompletedBoxes: []
                }
            });
            setRoomId(newRef.key);
            setMyRole('P1');
            setGameMode('playing');
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        const rid = customRoomId.trim();
        const roomRef = ref(db, `dots_and_boxes_rooms/${rid}`);
        const snapshot = await get(roomRef);
        const room = snapshot.val();

        if (!room) {
            // Create New Room
            // Initial Game State
            const ROWS = 6;
            const COLS = 6;
            const hLines = Array(ROWS).fill(null).map(() => Array(COLS - 1).fill(false));
            const vLines = Array(ROWS - 1).fill(null).map(() => Array(COLS).fill(false));
            const boxes = Array(ROWS - 1).fill(null).map(() => Array(COLS - 1).fill(null));

            await set(roomRef, {
                P1: { name: playerName, status: 'waiting' },
                state: 'waiting',
                gameState: {
                    hLines, vLines, boxes,
                    currentPlayer: 1,
                    scores: { 1: 0, 2: 0 },
                    winner: null,
                    lastCompletedBoxes: []
                }
            });
            setRoomId(rid);
            setMyRole('P1');
            setGameMode('playing');
        } else {
            // Join Existing
            if (!room.P2 && room.P1) {
                await update(ref(db, `dots_and_boxes_rooms/${rid}/P2`), {
                    name: playerName,
                    status: 'waiting'
                });
                await update(ref(db, `dots_and_boxes_rooms/${rid}`), {
                    state: 'playing'
                });
                setRoomId(rid);
                setMyRole('P2');
                setGameMode('playing');
            } else if (!room.P1 && room.P2) {
                await update(ref(db, `dots_and_boxes_rooms/${rid}/P1`), {
                    name: playerName,
                    status: 'waiting'
                });
                await update(ref(db, `dots_and_boxes_rooms/${rid}`), {
                    state: 'playing'
                });
                setRoomId(rid);
                setMyRole('P1');
                setGameMode('playing');
            } else {
                alert('満員です');
            }
        }
    };

    // Render Setup
    if (gameMode === 'setup') {
        return (
            <main className={menuStyles.container}>
                <div className={menuStyles.header}>
                    <h1 className={menuStyles.title}>Dots & Boxes</h1>
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
                <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ padding: '0 0 1rem', width: '100%' }}>
                        <button onClick={handleBackToMenu} className={menuStyles.backButton} style={{}}>
                            <IconBack size={20} /> メニューへ戻る (退出)
                        </button>
                    </div>
                    {/* Render Game */}
                    <DotsAndBoxesGame
                        roomId={roomId}
                        myRole={myRole}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className={menuStyles.container}>
            <>
                <div className={menuStyles.header}>
                    <Link href="/" className={menuStyles.backButton}>
                        <IconBack size={20} /> トップへ戻る
                    </Link>
                    <h1 className={menuStyles.title}>Dots & Boxes</h1>
                    <p className={menuStyles.subtitle}>陣取り頭脳バトル！</p>
                </div>

                {gameMode === 'menu' ? (
                    <div className={menuStyles.modeSelection}>
                        <button onClick={() => setGameMode('ai')} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconRobot size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ローカル対戦</span>
                            <span className={menuStyles.modeBtnDesc}>1台で2人対戦 / CPU</span>
                        </button>
                        <button onClick={joinRandomGame} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconDice size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ランダム対戦</span>
                            <span className={menuStyles.modeBtnDesc}>オンラインで対戦</span>
                        </button>
                        <button onClick={() => setGameMode('room')} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconKey size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={menuStyles.modeBtnDesc}>友達と対戦</span>
                        </button>
                    </div>
                ) : (
                    // Join Section (Random or Room)
                    <div className={menuStyles.joinSection}>
                        {gameMode === 'random' ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                                    <IconDice size={48} />
                                </div>
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
        </main>
    );
}
