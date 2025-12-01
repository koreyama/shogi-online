'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import GomokuBoard from '@/components/GomokuBoard';
import { Chat } from '@/components/Chat';
import { createInitialState, executeMove, checkWinner } from '@/lib/gomoku/engine';
import { GameState, Player } from '@/lib/gomoku/types';
import { getBestMove } from '@/lib/gomoku/ai';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function GomokuPage() {
    const router = useRouter();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Online State
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
    const [playerId, setPlayerId] = useState<string>('');

    // Player State
    const [playerName, setPlayerName] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        setMounted(true);
        setPlayerId(Math.random().toString(36).substring(2, 15));
    }, []);

    useEffect(() => {
        if (isLoaded && savedName) {
            setPlayerName(savedName);
            setStatus('initial');
        }
    }, [isLoaded, savedName]);

    useEffect(() => {
        if (roomId === 'ai-match') {
            setGameState(createInitialState());
            setStatus('playing');
            setMessages([]);
        } else if (roomId) {
            setGameState(null);
            setMessages([]);
        }
    }, [roomId]);

    // Firebase Listener
    useEffect(() => {
        if (!roomId || !myRole || roomId === 'ai-match') return;

        const roomRef = ref(db, `gomoku_rooms/${roomId}`);

        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.black && data.white) {
                if (status !== 'playing' && status !== 'finished') {
                    setStatus('playing');
                    setGameState(prev => prev || createInitialState());
                }
                if (myRole === 'black') setOpponentName(data.white.name);
                if (myRole === 'white') setOpponentName(data.black.name);
            }

            if (data.winner) {
                setGameState(prev => prev ? ({ ...prev, winner: data.winner }) : null);
                setStatus('finished');
            } else {
                if (status === 'finished') {
                    setStatus('playing');
                    setGameState(createInitialState());
                    setMessages([]);
                }
            }
        });

        const movesRef = ref(db, `gomoku_rooms/${roomId}/moves`);
        const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
            const moveData = snapshot.val();
            if (!moveData) return;

            setGameState(prev => {
                const currentState = prev || createInitialState();
                return executeMove(currentState, moveData.x, moveData.y);
            });
        });

        const chatRef = ref(db, `gomoku_rooms/${roomId}/chat`);
        const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        const rematchRef = ref(db, `gomoku_rooms/${roomId}/rematch`);
        const unsubscribeRematch = onValue(rematchRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.black && data.white) {
                if (myRole === 'black') {
                    set(ref(db, `gomoku_rooms/${roomId}/moves`), null);
                    set(ref(db, `gomoku_rooms/${roomId}/chat`), null);
                    set(ref(db, `gomoku_rooms/${roomId}/winner`), null);
                    set(ref(db, `gomoku_rooms/${roomId}/rematch`), null);
                }
            }
        });

        const myPlayerRef = ref(db, `gomoku_rooms/${roomId}/${myRole}`);
        onDisconnect(myPlayerRef).remove();

        return () => {
            unsubscribeRoom();
            unsubscribeMoves();
            off(movesRef);
            off(chatRef);
            off(roomRef);
            off(rematchRef);
            onDisconnect(myPlayerRef).cancel();
        };
    }, [roomId, myRole]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
            setStatus('initial');
        }
    };

    const joinRandomGame = async () => {
        setIsLoading(true);
        try {
            const roomsRef = ref(db, 'gomoku_rooms');
            const snapshot = await get(roomsRef);
            const rooms = snapshot.val();
            let foundRoomId = null;

            if (rooms) {
                for (const [id, room] of Object.entries(rooms) as [string, any][]) {
                    if (!room.black && !room.white) {
                        set(ref(db, `gomoku_rooms/${id}`), null);
                        continue;
                    }
                    if ((room.black && !room.white) || (!room.black && room.white)) {
                        foundRoomId = id;
                        break;
                    }
                }
            }

            if (foundRoomId) {
                const room = rooms[foundRoomId];
                if (!room.white) {
                    await update(ref(db, `gomoku_rooms/${foundRoomId}/white`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('white');
                } else {
                    await update(ref(db, `gomoku_rooms/${foundRoomId}/black`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('black');
                }
            } else {
                const newRoomRef = push(roomsRef);
                const newRoomId = newRoomRef.key!;
                const isBlack = Math.random() < 0.5;

                if (isBlack) {
                    await set(newRoomRef, { black: { name: playerName, id: playerId }, white: null });
                    setMyRole('black');
                } else {
                    await set(newRoomRef, { black: null, white: { name: playerName, id: playerId } });
                    setMyRole('white');
                }
                setRoomId(newRoomId);
                setStatus('waiting');
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        setIsLoading(true);
        try {
            const rid = customRoomId.trim();
            const roomRef = ref(db, `gomoku_rooms/${rid}`);
            const snapshot = await get(roomRef);
            const room = snapshot.val();

            if (!room) {
                const isBlack = Math.random() < 0.5;
                if (isBlack) {
                    await set(roomRef, { black: { name: playerName, id: playerId }, white: null });
                    setMyRole('black');
                } else {
                    await set(roomRef, { black: null, white: { name: playerName, id: playerId } });
                    setMyRole('white');
                }
                setRoomId(rid);
                setStatus('waiting');
            } else if (!room.white) {
                await update(ref(db, `gomoku_rooms/${rid}/white`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('white');
            } else if (!room.black) {
                await update(ref(db, `gomoku_rooms/${rid}/black`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('black');
            } else {
                alert('満員です');
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    const startAIGame = () => {
        setMyRole('black');
        setOpponentName('AI');
        setRoomId('ai-match');
    };

    // AI Logic
    useEffect(() => {
        if (roomId !== 'ai-match' || !gameState || gameState.turn !== 'white' || status !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState.board, 'white');
            if (bestMove) {
                const newState = executeMove(gameState, bestMove.x, bestMove.y);
                setGameState(newState);
                if (newState.winner) setStatus('finished');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, roomId, status]);

    const handleCellClick = (x: number, y: number) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;

        if (roomId === 'ai-match') {
            const newState = executeMove(gameState, x, y);
            setGameState(newState);
            if (newState.winner) setStatus('finished');
        } else {
            push(ref(db, `gomoku_rooms/${roomId}/moves`), { x, y, player: myRole });
        }
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
            return;
        }
        if (roomId) {
            push(ref(db, `gomoku_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const handleBackToTop = () => {
        if (roomId && myRole && roomId !== 'ai-match') {
            const myPlayerRef = ref(db, `gomoku_rooms/${roomId}/${myRole}`);
            set(myPlayerRef, null);
            onDisconnect(myPlayerRef).cancel();
        }
        router.push('/');
    };

    const handleRematch = () => {
        if (roomId === 'ai-match') {
            setGameState(createInitialState());
            setStatus('playing');
            setMessages([]);
        } else if (roomId && myRole) {
            update(ref(db, `gomoku_rooms/${roomId}/rematch`), { [myRole]: true });
        }
    };

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    if (status === 'setup') {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>五目並べ</h1>
                    <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                        <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="プレイヤー名" className={styles.input} required />
                        <button type="submit" className={styles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    if (status === 'initial') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>五目並べ</h1>
                    {!joinMode ? (
                        <div className={styles.modeSelection}>
                            <button onClick={joinRandomGame} className={styles.modeBtn}><IconDice size={48} color="#c53030" /><span className={styles.modeBtnTitle}>ランダム</span></button>
                            <button onClick={() => setJoinMode('room')} className={styles.modeBtn}><IconKey size={48} color="#c53030" /><span className={styles.modeBtnTitle}>ルーム</span></button>
                            <button onClick={startAIGame} className={styles.modeBtn}><IconRobot size={48} color="#c53030" /><span className={styles.modeBtnTitle}>AI対戦</span></button>
                        </div>
                    ) : joinMode === 'random' ? (
                        <div className={styles.joinSection}><p>マッチング中...</p><button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>キャンセル</button></div>
                    ) : (
                        <div className={styles.joinSection}>
                            <input type="text" value={customRoomId} onChange={e => setCustomRoomId(e.target.value)} placeholder="ルームID" className={styles.input} />
                            <button onClick={joinRoomGame} className={styles.primaryBtn}>参加/作成</button>
                            <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>戻る</button>
                        </div>
                    )}
                </div>

                {/* AdSense Content Section */}
                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>五目並べの遊び方とコツ</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>⚫</span>
                            <h3 className={styles.sectionTitle}>シンプルで奥深い伝統ゲーム</h3>
                        </div>
                        <p className={styles.textBlock}>
                            五目並べ（Gomoku）は、日本発祥のボードゲームで、囲碁の道具を使って遊ばれてきました。
                            ルールは非常にシンプルで「5つ並べたら勝ち」ですが、先手必勝を防ぐための「禁じ手」などのルールが整備され、
                            「連珠（れんじゅ）」として競技化もされています。このサイトでは、初心者でも遊びやすいシンプルなルールを採用しています。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>📏</span>
                            <h3 className={styles.sectionTitle}>基本ルール</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. 勝利条件</span>
                                <p className={styles.cardText}>自分の色の石を縦・横・斜めのいずれかに「5つ」連続で並べたら勝ちです。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. 手番</span>
                                <p className={styles.cardText}>黒（先手）と白（後手）が交互に盤上の交点に石を置いていきます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. 禁じ手（本サイトではなし）</span>
                                <p className={styles.cardText}>正式な競技ルールでは黒に「三三」「四四」「長連」などの禁じ手がありますが、ここでは自由に打てます。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>💡</span>
                            <h3 className={styles.sectionTitle}>勝つための定石</h3>
                        </div>
                        <p className={styles.textBlock}>
                            五目並べで勝つためには、「相手に防がれない形」を作ることが重要です。
                        </p>
                        <div className={styles.highlightBox}>
                            <span className={styles.highlightTitle}>「四三（しさん）」を作る</span>
                            <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                「4つ並び（四）」と「3つ並び（三）」を同時に作る手です。
                                相手は「四」を止めなければなりませんが、その間に「三」を「四」に伸ばすことで、次に必ず5つ並ぶ形（四三勝ち）になります。
                            </p>
                        </div>
                        <ul className={styles.list}>
                            <li className={styles.listItem}>
                                <strong>「三」の重要性</strong><br />
                                両端が空いている3つ並び（活き三）を作ると、相手は防ぐのに手一杯になります。これを連続で作って攻め続けましょう。
                            </li>
                            <li className={styles.listItem}>
                                <strong>相手の「四」を止める</strong><br />
                                相手が4つ並べたら（または片側が空いている3つ並べたら）、すぐに止めないと負けてしまいます。守りも重要です。
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        );
    }

    if (status === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#c53030" /></div>
                    <p>ルームID: <span className={styles.roomId}>{roomId}</span></p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <div className={styles.playerInfo}>
                            <p>{opponentName || '相手'}</p>
                            <p>白 (後手)</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>黒 (先手)</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {gameState?.turn === 'black' ? '黒の番' : '白の番'}
                        {gameState?.turn === myRole && ' (あなた)'}
                    </div>
                    <GomokuBoard
                        board={gameState!.board}
                        onCellClick={handleCellClick}
                        lastMove={gameState!.history[gameState!.history.length - 1]}
                        turn={gameState!.turn}
                        isMyTurn={gameState!.turn === myRole}
                        winner={gameState!.winner}
                    />
                </div>
            </div>
            {gameState?.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'black' ? '黒' : gameState.winner === 'white' ? '白' : '引き分け'}</p>
                        <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}


        </main>
    );
}
