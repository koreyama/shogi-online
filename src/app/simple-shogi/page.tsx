'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import SimpleShogiBoard from '@/components/SimpleShogiBoard';
import { Chat } from '@/components/Chat';
import { createInitialState, getValidMoves, move } from '@/lib/simple-shogi/engine';
import { GameState, Player, PieceType } from '@/lib/simple-shogi/types';
import { getBestMove } from '@/lib/simple-shogi/ai';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import SimpleShogiRuleGuide from '@/components/SimpleShogiRuleGuide';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function SimpleShogiPage() {
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

    // Game Interaction State
    const [selectedPos, setSelectedPos] = useState<{ r: number, c: number } | null>(null);
    const [selectedHand, setSelectedHand] = useState<PieceType | null>(null);
    const [validMoves, setValidMoves] = useState<any[]>([]);

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

    // Update valid moves
    useEffect(() => {
        if (gameState && gameState.turn === myRole && status === 'playing') {
            const moves = getValidMoves(gameState, myRole);
            setValidMoves(moves);
        } else {
            setValidMoves([]);
        }
    }, [gameState, myRole, status]);

    // Firebase Listener
    useEffect(() => {
        if (!roomId || !myRole || roomId === 'ai-match') return;

        const roomRef = ref(db, `simpleshogi_rooms/${roomId}`);

        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.sente && data.gote) {
                if (status !== 'playing' && status !== 'finished') {
                    setStatus('playing');
                    setGameState(prev => prev || createInitialState());
                }
                if (myRole === 'sente') setOpponentName(data.gote.name);
                if (myRole === 'gote') setOpponentName(data.sente.name);
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

        const movesRef = ref(db, `simpleshogi_rooms/${roomId}/moves`);
        const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
            const moveData = snapshot.val();
            if (!moveData) return;

            setGameState(prev => {
                const currentState = prev || createInitialState();
                return move(currentState, moveData);
            });
        });

        const chatRef = ref(db, `simpleshogi_rooms/${roomId}/chat`);
        const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        const rematchRef = ref(db, `simpleshogi_rooms/${roomId}/rematch`);
        const unsubscribeRematch = onValue(rematchRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.sente && data.gote) {
                if (myRole === 'sente') {
                    set(ref(db, `simpleshogi_rooms/${roomId}/moves`), null);
                    set(ref(db, `simpleshogi_rooms/${roomId}/chat`), null);
                    set(ref(db, `simpleshogi_rooms/${roomId}/winner`), null);
                    set(ref(db, `simpleshogi_rooms/${roomId}/rematch`), null);
                }
            }
        });

        const myPlayerRef = ref(db, `simpleshogi_rooms/${roomId}/${myRole}`);
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
            const roomsRef = ref(db, 'simpleshogi_rooms');
            const snapshot = await get(roomsRef);
            const rooms = snapshot.val();
            let foundRoomId = null;

            if (rooms) {
                for (const [id, room] of Object.entries(rooms) as [string, any][]) {
                    if ((room.sente && !room.gote) || (!room.sente && room.gote)) {
                        foundRoomId = id;
                        break;
                    }
                }
            }

            if (foundRoomId) {
                const room = rooms[foundRoomId];
                if (!room.gote) {
                    await update(ref(db, `simpleshogi_rooms/${foundRoomId}/gote`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('gote');
                } else {
                    await update(ref(db, `simpleshogi_rooms/${foundRoomId}/sente`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('sente');
                }
            } else {
                const newRoomRef = push(roomsRef);
                const newRoomId = newRoomRef.key!;
                const isSente = Math.random() < 0.5;

                if (isSente) {
                    await set(newRoomRef, { sente: { name: playerName, id: playerId }, gote: null });
                    setMyRole('sente');
                } else {
                    await set(newRoomRef, { sente: null, gote: { name: playerName, id: playerId } });
                    setMyRole('gote');
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
            const roomRef = ref(db, `simpleshogi_rooms/${rid}`);
            const snapshot = await get(roomRef);
            const room = snapshot.val();

            if (!room) {
                const isSente = Math.random() < 0.5;
                if (isSente) {
                    await set(roomRef, { sente: { name: playerName, id: playerId }, gote: null });
                    setMyRole('sente');
                } else {
                    await set(roomRef, { sente: null, gote: { name: playerName, id: playerId } });
                    setMyRole('gote');
                }
                setRoomId(rid);
                setStatus('waiting');
            } else if (!room.gote) {
                await update(ref(db, `simpleshogi_rooms/${rid}/gote`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('gote');
            } else if (!room.sente) {
                await update(ref(db, `simpleshogi_rooms/${rid}/sente`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('sente');
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
        setMyRole('sente');
        setOpponentName('AI');
        setRoomId('ai-match');
    };

    // AI Logic
    useEffect(() => {
        if (roomId !== 'ai-match' || !gameState || gameState.turn !== 'gote' || status !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'gote');
            if (bestMove) {
                const newState = move(gameState, bestMove);
                setGameState(newState);
                if (newState.winner) setStatus('finished');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, roomId, status]);

    const handleCellClick = (r: number, c: number) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;

        const piece = gameState.board[r][c];

        // Select piece to move
        if (piece && piece.owner === myRole) {
            setSelectedPos({ r, c });
            setSelectedHand(null);
            return;
        }

        // Move or Drop
        if (selectedPos) {
            const moveAction = validMoves.find(m => !m.isDrop && m.from.r === selectedPos.r && m.from.c === selectedPos.c && m.to.r === r && m.to.c === c);
            if (moveAction) {
                executeMove(moveAction);
                setSelectedPos(null);
            }
        } else if (selectedHand) {
            const dropAction = validMoves.find(m => m.isDrop && m.type === selectedHand && m.to.r === r && m.to.c === c);
            if (dropAction) {
                executeMove(dropAction);
                setSelectedHand(null);
            }
        }
    };

    const handleHandClick = (type: PieceType) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;
        setSelectedHand(type);
        setSelectedPos(null);
    };

    const executeMove = (action: any) => {
        if (roomId === 'ai-match') {
            const newState = move(gameState!, action);
            setGameState(newState);
            if (newState.winner) setStatus('finished');
        } else {
            push(ref(db, `simpleshogi_rooms/${roomId}/moves`), action);
        }
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
            return;
        }
        if (roomId) {
            push(ref(db, `simpleshogi_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const handleBackToTop = () => {
        if (roomId && myRole && roomId !== 'ai-match') {
            const myPlayerRef = ref(db, `simpleshogi_rooms/${roomId}/${myRole}`);
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
            update(ref(db, `simpleshogi_rooms/${roomId}/rematch`), { [myRole]: true });
        }
    };

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    if (status === 'setup') {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>ファンタジー将棋</h1>
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
                    <h1 className={styles.title}>ファンタジー将棋</h1>
                    {!joinMode ? (
                        <div className={styles.modeSelection}>
                            <button onClick={joinRandomGame} className={styles.modeBtn}><IconDice size={48} color="#805ad5" /><span className={styles.modeBtnTitle}>ランダム</span></button>
                            <button onClick={() => setJoinMode('room')} className={styles.modeBtn}><IconKey size={48} color="#805ad5" /><span className={styles.modeBtnTitle}>ルーム</span></button>
                            <button onClick={startAIGame} className={styles.modeBtn}><IconRobot size={48} color="#805ad5" /><span className={styles.modeBtnTitle}>AI対戦</span></button>
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
                    <h2 className={styles.contentTitle}>ファンタジー将棋（どうぶつしょうぎ風）の遊び方</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🦁</span>
                            <h3 className={styles.sectionTitle}>小さな盤面で熱い頭脳戦</h3>
                        </div>
                        <p className={styles.textBlock}>
                            ファンタジー将棋は、3×4マスの小さな盤面で遊ぶ、将棋を簡略化したミニゲームです。
                            「どうぶつしょうぎ」と同様のルールを採用しており、駒の動きがわかりやすく、短時間で決着がつくため、
                            将棋の入門用としても、手軽な頭の体操としても最適です。
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
                                <p className={styles.cardText}>相手の「ライオン（王）」を取るか（キャッチ）、自分のライオンが相手の陣地（一番奥の段）に入れば（トライ）勝ちです。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. 駒の動き</span>
                                <p className={styles.cardText}>
                                    <strong>ライオン</strong>：全方向に1マス<br />
                                    <strong>キリン</strong>：縦横に1マス<br />
                                    <strong>ゾウ</strong>：斜めに1マス<br />
                                    <strong>ヒヨコ</strong>：前に1マス
                                </p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. 持ち駒</span>
                                <p className={styles.cardText}>取った駒を自分の駒として、空いているマスに打つことができます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. 成り</span>
                                <p className={styles.cardText}>ヒヨコが相手の陣地に入ると「ニワトリ」になり、動きがパワーアップします（金将と同じ動き）。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🧠</span>
                            <h3 className={styles.sectionTitle}>勝つためのコツ</h3>
                        </div>
                        <p className={styles.textBlock}>
                            盤面が狭いので、1つのミスが命取りになります。
                        </p>
                        <div className={styles.highlightBox}>
                            <span className={styles.highlightTitle}>トライを狙え</span>
                            <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                相手のライオンを詰ますだけでなく、自分のライオンを安全に相手陣地に運ぶ「トライ」も立派な勝ち方です。
                                隙があれば積極的に狙っていきましょう。ただし、トライした瞬間に取られてしまう場合は負けになります。
                            </p>
                        </div>
                        <ul className={styles.list}>
                            <li className={styles.listItem}>
                                <strong>持ち駒を活用する</strong><br />
                                取った駒をどこに打つかが勝負の鍵を握ります。相手のライオンの逃げ道を塞ぐように打つのが基本です。
                            </li>
                            <li className={styles.listItem}>
                                <strong>ヒヨコの成長</strong><br />
                                ヒヨコをニワトリに成らせると、攻撃力が大幅にアップします。ただし、取られると相手にニワトリとして使われるわけではなく、ヒヨコに戻るので注意。
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
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#805ad5" /></div>
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
                            <p>{myRole === 'sente' ? '後手' : '先手'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 'sente' ? '先手' : '後手'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                    <div className={styles.ruleSection}>
                        <SimpleShogiRuleGuide />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {gameState?.turn === 'sente' ? '先手の番' : '後手の番'}
                        {gameState?.turn === myRole && ' (あなた)'}
                    </div>
                    <SimpleShogiBoard
                        board={gameState!.board}
                        hands={gameState!.hands}
                        turn={gameState!.turn}
                        myRole={myRole}
                        validMoves={validMoves}
                        onCellClick={handleCellClick}
                        onHandClick={handleHandClick}
                        selectedPos={selectedPos}
                        selectedHand={selectedHand}
                        lastMove={gameState!.history[gameState!.history.length - 1]}
                    />
                </div>
            </div>
            {gameState?.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'sente' ? '先手' : '後手'}</p>
                        <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}


        </main>
    );
}
