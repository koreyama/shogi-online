'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import MancalaBoard from '@/components/MancalaBoard';
import { Chat } from '@/components/Chat';
import { createInitialState, executeMove, isValidMove } from '@/lib/mancala/engine';
import { GameState, Player } from '@/lib/mancala/types';
import { getBestMove } from '@/lib/mancala/ai';
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

export default function MancalaPage() {
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

        const roomRef = ref(db, `mancala_rooms/${roomId}`);

        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.first && data.second) {
                if (status !== 'playing' && status !== 'finished') {
                    setStatus('playing');
                    setGameState(prev => prev || createInitialState());
                }
                if (myRole === 'first') setOpponentName(data.second.name);
                if (myRole === 'second') setOpponentName(data.first.name);
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

        const movesRef = ref(db, `mancala_rooms/${roomId}/moves`);
        const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
            const moveData = snapshot.val();
            if (!moveData) return;

            setGameState(prev => {
                const currentState = prev || createInitialState();
                return executeMove(currentState, moveData.pitIndex);
            });
        });

        const chatRef = ref(db, `mancala_rooms/${roomId}/chat`);
        const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        const rematchRef = ref(db, `mancala_rooms/${roomId}/rematch`);
        const unsubscribeRematch = onValue(rematchRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.first && data.second) {
                if (myRole === 'first') {
                    set(ref(db, `mancala_rooms/${roomId}/moves`), null);
                    set(ref(db, `mancala_rooms/${roomId}/chat`), null);
                    set(ref(db, `mancala_rooms/${roomId}/winner`), null);
                    set(ref(db, `mancala_rooms/${roomId}/rematch`), null);
                }
            }
        });

        const myPlayerRef = ref(db, `mancala_rooms/${roomId}/${myRole}`);
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
            const roomsRef = ref(db, 'mancala_rooms');
            const snapshot = await get(roomsRef);
            const rooms = snapshot.val();
            let foundRoomId = null;

            if (rooms) {
                for (const [id, room] of Object.entries(rooms) as [string, any][]) {
                    if (!room.first && !room.second) {
                        set(ref(db, `mancala_rooms/${id}`), null);
                        continue;
                    }
                    if ((room.first && !room.second) || (!room.first && room.second)) {
                        foundRoomId = id;
                        break;
                    }
                }
            }

            if (foundRoomId) {
                const room = rooms[foundRoomId];
                if (!room.second) {
                    await update(ref(db, `mancala_rooms/${foundRoomId}/second`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('second');
                } else {
                    await update(ref(db, `mancala_rooms/${foundRoomId}/first`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('first');
                }
            } else {
                const newRoomRef = push(roomsRef);
                const newRoomId = newRoomRef.key!;
                const isFirst = Math.random() < 0.5;

                if (isFirst) {
                    await set(newRoomRef, { first: { name: playerName, id: playerId }, second: null });
                    setMyRole('first');
                } else {
                    await set(newRoomRef, { first: null, second: { name: playerName, id: playerId } });
                    setMyRole('second');
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
            const roomRef = ref(db, `mancala_rooms/${rid}`);
            const snapshot = await get(roomRef);
            const room = snapshot.val();

            if (!room) {
                const isFirst = Math.random() < 0.5;
                if (isFirst) {
                    await set(roomRef, { first: { name: playerName, id: playerId }, second: null });
                    setMyRole('first');
                } else {
                    await set(roomRef, { first: null, second: { name: playerName, id: playerId } });
                    setMyRole('second');
                }
                setRoomId(rid);
                setStatus('waiting');
            } else if (!room.second) {
                await update(ref(db, `mancala_rooms/${rid}/second`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('second');
            } else if (!room.first) {
                await update(ref(db, `mancala_rooms/${rid}/first`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('first');
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
        setMyRole('first');
        setOpponentName('AI');
        setRoomId('ai-match');
    };

    // AI Logic
    useEffect(() => {
        if (roomId !== 'ai-match' || !gameState || gameState.turn !== 'second' || status !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'second');
            if (bestMove !== null) {
                const newState = executeMove(gameState, bestMove);
                setGameState(newState);
                if (newState.winner) setStatus('finished');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, roomId, status]);

    const handlePitClick = (pitIndex: number) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;

        // 自分の側のピットか確認
        // first: 0-5, second: 7-12
        if (myRole === 'first' && (pitIndex < 0 || pitIndex > 5)) return;
        if (myRole === 'second' && (pitIndex < 7 || pitIndex > 12)) return;

        if (!isValidMove(gameState, pitIndex)) return;

        if (roomId === 'ai-match') {
            const newState = executeMove(gameState, pitIndex);
            setGameState(newState);
            if (newState.winner) setStatus('finished');
        } else {
            push(ref(db, `mancala_rooms/${roomId}/moves`), { pitIndex, player: myRole });
        }
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
            return;
        }
        if (roomId) {
            push(ref(db, `mancala_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const handleBackToTop = () => {
        if (roomId && myRole && roomId !== 'ai-match') {
            const myPlayerRef = ref(db, `mancala_rooms/${roomId}/${myRole}`);
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
            update(ref(db, `mancala_rooms/${roomId}/rematch`), { [myRole]: true });
        }
    };

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    if (status === 'setup') {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>マンカラ</h1>
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
                    <h1 className={styles.title}>マンカラ</h1>
                    {!joinMode ? (
                        <div className={styles.modeSelection}>
                            <button onClick={joinRandomGame} className={styles.modeBtn}><IconDice size={48} color="#d69e2e" /><span className={styles.modeBtnTitle}>ランダム</span></button>
                            <button onClick={() => setJoinMode('room')} className={styles.modeBtn}><IconKey size={48} color="#d69e2e" /><span className={styles.modeBtnTitle}>ルーム</span></button>
                            <button onClick={startAIGame} className={styles.modeBtn}><IconRobot size={48} color="#d69e2e" /><span className={styles.modeBtnTitle}>AI対戦</span></button>
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
                    <h2 className={styles.contentTitle}>マンカラ（カラハ）の遊び方と歴史</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🌍</span>
                            <h3 className={styles.sectionTitle}>世界最古のゲーム「マンカラ」</h3>
                        </div>
                        <p className={styles.textBlock}>
                            マンカラ（Mancala）は、紀元前から遊ばれている世界最古のボードゲームの一つです。
                            アフリカや中近東、東南アジアなど世界中で親しまれており、数百種類以上のルールが存在します。
                            このサイトでは、最もポピュラーなルールの一つである「ベーシック（カラハ）」を採用しています。
                            種を撒いて自分の陣地（ストア）に集めるだけのシンプルなルールですが、先を読む計算力が試される知育ゲームとしても人気です。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>💎</span>
                            <h3 className={styles.sectionTitle}>基本ルール（カラハ）</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. 種まき</span>
                                <p className={styles.cardText}>自分のポケットから1つ選び、中の石をすべて取ります。反時計回りに隣の穴へ1つずつ入れていきます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. ゴール</span>
                                <p className={styles.cardText}>右端の大きな穴が自分のゴール（ストア）です。ここにも石を入れますが、相手のストアは飛ばします。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. ぴったりゴール</span>
                                <p className={styles.cardText}>最後の石が自分のストアに入ったら、もう一度自分の番になります（連続手番）。これが勝利の鍵です！</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. 横取り</span>
                                <p className={styles.cardText}>最後の石が自分の空のポケットに入り、向かい側に相手の石があれば、それらをすべて獲得できます。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🧠</span>
                            <h3 className={styles.sectionTitle}>勝つためのコツ</h3>
                        </div>
                        <p className={styles.textBlock}>
                            マンカラは運の要素がない完全情報ゲームです。勝つためには「先読み」が全てです。
                        </p>
                        <div className={styles.highlightBox}>
                            <span className={styles.highlightTitle}>連続手番を狙う</span>
                            <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                常に「どのポケットを選べばストアで終わるか」を計算しましょう。
                                連続手番ができれば、相手にターンを渡さずに自分の石をどんどんゴールに運ぶことができます。
                                特に序盤は、一番右側のポケットからスタートすると必ず連続手番になります。
                            </p>
                        </div>
                        <ul className={styles.list}>
                            <li className={styles.listItem}>
                                <strong>相手の邪魔をする</strong><br />
                                相手が次に連続手番を狙っていそうなポケットがあれば、そこに自分の石を送り込んで個数を変えてしまうのも有効な戦術です。
                            </li>
                            <li className={styles.listItem}>
                                <strong>横取りの罠を張る</strong><br />
                                あえて自分のポケットを空にしておき、相手が石を入れてくるのを待つ、あるいは自分でタイミングを合わせて横取りを狙うなど、高度な駆け引きも楽しめます。
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
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#d69e2e" /></div>
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
                            <p>Second (上)</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>First (下)</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {gameState?.turn === 'first' ? 'Firstの番 (下)' : 'Secondの番 (上)'}
                        {gameState?.turn === myRole && ' (あなた)'}
                    </div>
                    <MancalaBoard
                        board={gameState!.board}
                        onPitClick={handlePitClick}
                        turn={gameState!.turn}
                        isMyTurn={gameState!.turn === myRole}
                        winner={gameState!.winner}
                        myRole={myRole}
                    />
                </div>
            </div>
            {gameState?.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'first' ? 'First' : gameState.winner === 'second' ? 'Second' : '引き分け'}</p>
                        <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}
        </main>
    );
}
